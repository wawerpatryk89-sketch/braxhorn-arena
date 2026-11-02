using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Linq;
using System.Text;
using Newtonsoft.Json.Linq;
using Unity.Collections;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace Braxhorn.Arena.Editor
{
    public static class NativeFighterImporter
    {
        const string Source = "Assets/Arena/SourceData";
        public const string Imported = "Assets/Arena/Resources/Fighters";
        static readonly Matrix4x4 Reflection = Matrix4x4.Scale(new Vector3(1, 1, -1));

        [MenuItem("Braxhorn/Migration/Import exported fighters")]
        public static void ImportAll()
        {
            if (!File.Exists(Source + "/manifest.json")) throw new FileNotFoundException("Run unity-tools/arena/export-source.mjs first.");
            var manifest = JObject.Parse(File.ReadAllText(Source + "/manifest.json"));
            if ((bool)manifest["partial"]) throw new InvalidDataException("Partial diagnostic exports cannot replace the full roster.");
            QualitySettings.skinWeights = SkinWeights.Unlimited;
            foreach (var row in (JArray)manifest["fighters"])
            {
                var id = (string)row["id"];
                if (string.IsNullOrEmpty(id) || id.Any(c => !(c >= 'A' && c <= 'Z') && !(c >= '0' && c <= '9') && c != '_'))
                    throw new InvalidDataException("Invalid fighter identifier.");
                var directory = Source + "/" + id;
                var info = JObject.Parse(File.ReadAllText(directory + "/fighter.json"));
                if (!(bool)info["complete"] || ((JArray)info["actions"]).Count != (int)row["actionCount"])
                    throw new InvalidDataException(id + ": incomplete action package.");
                ImportFighter(directory);
            }
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        public static Matrix4x4 ConvertMatrix(JToken values)
        {
            if (values == null || values.Count() != 16) throw new InvalidDataException("A transform must contain 16 values.");
            var m = new Matrix4x4();
            for (var i = 0; i < 16; i++) m[i % 4, i / 4] = (float)values[i];
            return Reflection * m * Reflection;
        }

        static JObject ReadPacked(string file)
        {
            using var source = File.OpenRead(file);
            using var gzip = new GZipStream(source, CompressionMode.Decompress);
            using var reader = new StreamReader(gzip);
            return JObject.Parse(reader.ReadToEnd());
        }

        static void Upsert(UnityEngine.Object value, string path)
        {
            var existing = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(path);
            if (existing) { EditorUtility.CopySerialized(value, existing); UnityEngine.Object.DestroyImmediate(value); }
            else AssetDatabase.CreateAsset(value, path);
        }

        static void ImportFighter(string directory)
        {
            var info = JObject.Parse(File.ReadAllText(directory + "/fighter.json"));
            var id = (string)info["id"];
            var output = Imported + "/" + id;
            Directory.CreateDirectory(output + "/Actions");
            AssetDatabase.Refresh();
            var model = ReadPacked(directory + "/model.bytes");
            var rows = (JArray)model["nodes"];
            var nodes = new Transform[rows.Count];
            GameObject root = null;
            try
            {
                for (var i = 0; i < rows.Count; i++)
                {
                    var row = rows[i];
                    nodes[i] = new GameObject((string)row["name"]).transform;
                    if (i == 0) root = nodes[i].gameObject;
                    var parent = (int)row["parent"];
                    if (parent >= i) throw new InvalidDataException("Nodes must be in parent-first order.");
                    if (parent >= 0) nodes[i].SetParent(nodes[parent], false);
                    var m = ConvertMatrix(row["matrix"]);
                    nodes[i].localPosition = m.GetColumn(3);
                    nodes[i].localRotation = m.rotation;
                    nodes[i].localScale = m.lossyScale;
                    var rebuilt = Matrix4x4.TRS(nodes[i].localPosition, nodes[i].localRotation, nodes[i].localScale);
                    for (var k = 0; k < 16; k++)
                        if (Mathf.Abs(m[k] - rebuilt[k]) > .001f) throw new InvalidDataException(id + ": unsupported shear or reflected scale at " + nodes[i].name);
                }
                var material = ImportMaterial(directory, output);
                var meshIndex = 0;
                foreach (var row in (JArray)model["meshes"])
                {
                    var mesh = CreateMesh(row, nodes, out var bones);
                    var meshPath = output + "/Mesh" + meshIndex++ + ".asset";
                    Upsert(mesh, meshPath);
                    mesh = AssetDatabase.LoadAssetAtPath<Mesh>(meshPath);
                    var node = nodes[(int)row["node"]];
                    if (bones.Length > 0)
                    {
                        var renderer = node.gameObject.AddComponent<SkinnedMeshRenderer>();
                        renderer.sharedMesh = mesh;
                        renderer.bones = bones;
                        renderer.rootBone = nodes[0];
                        renderer.sharedMaterials = Enumerable.Repeat(material, mesh.subMeshCount).ToArray();
                        renderer.quality = SkinQuality.Auto;
                        renderer.updateWhenOffscreen = true;
                        // Review stage: authored throws extend well beyond the idle mesh.
                        // Tight per-clip bounds are a separate measured optimization.
                        renderer.localBounds = new Bounds(mesh.bounds.center, Vector3.one * 1000);
                    }
                    else
                    {
                        node.gameObject.AddComponent<MeshFilter>().sharedMesh = mesh;
                        node.gameObject.AddComponent<MeshRenderer>().sharedMaterials = Enumerable.Repeat(material, mesh.subMeshCount).ToArray();
                    }
                }
                root.AddComponent<Animator>();
                root.AddComponent<FighterPosePlayer>();
                var prefab = PrefabUtility.SaveAsPrefabAsset(root, output + "/" + id + ".prefab");
                var entries = new List<FighterActionClip>();
                foreach (var action in (JArray)info["actions"])
                {
                    var actionId = (string)action["id"];
                    var clipPath = output + "/Actions/" + actionId + ".anim";
                    var poseFile = directory + "/" + (string)action["file"];
                    using (var sha = SHA256.Create())
                    using (var bytes = File.OpenRead(poseFile))
                        if (BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant() != (string)action["sha256"])
                            throw new InvalidDataException(id + "/" + actionId + ": pose hash mismatch.");
                    var clip = ImportAnimation(poseFile, actionId);
                    Upsert(clip, clipPath);
                    entries.Add(new FighterActionClip { id = actionId, clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath), duration = (float)action["duration"] });
                }
                var definition = ScriptableObject.CreateInstance<FighterDefinition>();
                definition.id = id;
                definition.baseId = (string)info["base"];
                definition.displayName = (string)info["displayName"];
                definition.npc = (bool)info["npc"];
                definition.complete = (bool)info["complete"];
                definition.prefab = prefab;
                definition.configuration = AssetDatabase.LoadAssetAtPath<TextAsset>(directory + "/config.bytes");
                definition.actions = entries.ToArray();
                var complete = definition.complete;
                Upsert(definition, output + "/" + id + ".asset");
                Debug.Log("Native Unity fighter imported: " + id + ", " + entries.Count + " actions; complete=" + complete);
            }
            finally { if (root) UnityEngine.Object.DestroyImmediate(root); }
        }

        static Mesh CreateMesh(JToken row, Transform[] nodes, out Transform[] bones)
        {
            var attributes = row["attributes"];
            var points = attributes["position"]["array"].Values<float>().ToArray();
            var vertices = new Vector3[points.Length / 3];
            for (var i = 0; i < vertices.Length; i++) vertices[i] = new Vector3(points[i * 3], points[i * 3 + 1], -points[i * 3 + 2]);
            var mesh = new Mesh { name = nodes[(int)row["node"]].name, indexFormat = IndexFormat.UInt32, vertices = vertices };
            var normals = attributes["normal"]?["array"]?.Values<float>().ToArray();
            if (normals != null)
            {
                var values = new Vector3[vertices.Length];
                for (var i = 0; i < values.Length; i++) values[i] = new Vector3(normals[i * 3], normals[i * 3 + 1], -normals[i * 3 + 2]);
                mesh.normals = values;
            }
            var uv = attributes["uv"]?["array"]?.Values<float>().ToArray();
            if (uv != null)
            {
                var values = new Vector2[vertices.Length];
                for (var i = 0; i < values.Length; i++) values[i] = new Vector2(uv[i * 2], uv[i * 2 + 1]);
                mesh.uv = values;
            }
            var indices = row["index"]?.Type == JTokenType.Array ? row["index"].Values<int>().ToArray() : Enumerable.Range(0, vertices.Length).ToArray();
            if (indices.Length % 3 != 0) throw new InvalidDataException("Triangle indices are incomplete.");
            for (var i = 0; i < indices.Length; i += 3) (indices[i + 1], indices[i + 2]) = (indices[i + 2], indices[i + 1]);
            mesh.triangles = indices;
            var sourceBones = row["bones"].Values<int>().ToArray();
            bones = sourceBones.Select(i => nodes[i]).ToArray();
            if (bones.Length > 0)
            {
                var bind = ConvertMatrix(row["bindMatrix"]);
                var bindposes = ((JArray)row["inverses"]).Select(m => ConvertMatrix(m) * bind).ToList();
                var groups = ((JObject)attributes).Properties().Where(p => p.Name.StartsWith("skinWeight", StringComparison.Ordinal)).Select(p => new {
                    weights = p.Value["array"].Values<float>().ToArray(),
                    indices = attributes[p.Name.Replace("Weight", "Index")]["array"].Values<int>().ToArray()
                }).ToArray();
                var counts = new byte[vertices.Length];
                var allWeights = new List<BoneWeight1>(vertices.Length * 8);
                var perVertex = new Dictionary<int, float>();
                // Zero-weight source vertices stay attached to their mesh in Three.
                // Preserve that behavior using an identity bind bone in Unity.
                var fallbackIndex = bones.Length;
                bones = bones.Concat(new[] { nodes[(int)row["node"]] }).ToArray();
                bindposes.Add(Matrix4x4.identity);
                for (var i = 0; i < vertices.Length; i++)
                {
                    perVertex.Clear();
                    foreach (var group in groups)
                        for (var component = 0; component < 4; component++)
                        {
                            var weight = group.weights[i * 4 + component];
                            if (weight <= 0) continue;
                            var bone = group.indices[i * 4 + component];
                            if (bone < 0 || bone >= sourceBones.Length) throw new InvalidDataException("Bone index is outside skeleton.");
                            perVertex.TryGetValue(bone, out var previous);
                            perVertex[bone] = previous + weight;
                        }
                    if (perVertex.Count == 0) perVertex.Add(fallbackIndex, 1);
                    var sum = perVertex.Values.Sum();
                    if (Mathf.Abs(sum - 1) > .001f) throw new InvalidDataException("Source skin weights are not normalized.");
                    counts[i] = checked((byte)perVertex.Count);
                    foreach (var pair in perVertex.OrderByDescending(p => p.Value)) allWeights.Add(new BoneWeight1 { boneIndex = pair.Key, weight = pair.Value / sum });
                }
                using var nativeCounts = new NativeArray<byte>(counts, Allocator.Temp);
                using var nativeWeights = new NativeArray<BoneWeight1>(allWeights.ToArray(), Allocator.Temp);
                mesh.SetBoneWeights(nativeCounts, nativeWeights);
                mesh.bindposes = bindposes.ToArray();
            }
            if (normals == null) mesh.RecalculateNormals();
            if (uv != null) mesh.RecalculateTangents();
            mesh.RecalculateBounds();
            return mesh;
        }

        static Material ImportMaterial(string source, string output)
        {
            var data = JObject.Parse(File.ReadAllText(source + "/material.json"));
            foreach (var kind in new[] { "color", "normal", "metallicSmoothness" })
            {
                var path = source + "/" + kind + ".png";
                var importer = (TextureImporter)AssetImporter.GetAtPath(path);
                if (!importer) throw new FileNotFoundException("Missing converted texture", path);
                importer.textureType = kind == "normal" ? TextureImporterType.NormalMap : TextureImporterType.Default;
                importer.sRGBTexture = kind == "color";
                importer.maxTextureSize = 8192;
                importer.wrapMode = TextureWrapMode.Repeat;
                importer.anisoLevel = 4;
                importer.SaveAndReimport();
            }
            var shader = Shader.Find("Braxhorn/Source PBR");
            if (!shader) throw new InvalidOperationException("Source PBR shader is unavailable.");
            var material = new Material(shader);
            var rgb = data["diffuse"].Values<float>().ToArray();
            material.color = new Color(rgb[0], rgb[1], rgb[2], 1).linear;
            material.mainTexture = AssetDatabase.LoadAssetAtPath<Texture2D>(source + "/color.png");
            material.SetTexture("_BumpMap", AssetDatabase.LoadAssetAtPath<Texture2D>(source + "/normal.png"));
            material.SetTexture("_MetallicGlossMap", AssetDatabase.LoadAssetAtPath<Texture2D>(source + "/metallicSmoothness.png"));
            material.SetFloat("_Cull", (bool)data["doubleSided"] ? (float)CullMode.Off : (float)CullMode.Back);
            var pathOut = output + "/Material.mat";
            Upsert(material, pathOut);
            return AssetDatabase.LoadAssetAtPath<Material>(pathOut);
        }

        public static AnimationClip ImportAnimation(string file, string name)
        {
            using var stream = File.OpenRead(file);
            using var gzip = new GZipStream(stream, CompressionMode.Decompress);
            using var reader = new BinaryReader(gzip, Encoding.UTF8);
            if (Encoding.ASCII.GetString(reader.ReadBytes(4)) != "BAP1") throw new InvalidDataException("Unsupported pose format.");
            var nodeCount = reader.ReadInt32();
            var frameCount = reader.ReadInt32();
            if (nodeCount <= 0 || nodeCount > 4096 || frameCount < 2 || frameCount > 36000) throw new InvalidDataException("Pose dimensions are invalid.");
            var paths = new string[nodeCount];
            for (var i = 0; i < paths.Length; i++)
            {
                var length = reader.ReadInt32();
                if (length < 0 || length > 65536) throw new InvalidDataException("Invalid bone path.");
                paths[i] = Encoding.UTF8.GetString(reader.ReadBytes(length));
            }
            var times = new float[frameCount];
            for (var i = 0; i < times.Length; i++) { times[i] = reader.ReadSingle(); if (i > 0 && times[i] <= times[i - 1]) throw new InvalidDataException("Sample times must increase."); }
            var values = new float[checked(nodeCount * frameCount * 10)];
            for (var i = 0; i < values.Length; i++) { values[i] = reader.ReadSingle(); if (float.IsNaN(values[i]) || float.IsInfinity(values[i])) throw new InvalidDataException("Nonfinite pose."); }
            if (reader.Read() != -1) throw new InvalidDataException("Unexpected pose data.");
            var clip = new AnimationClip { name = name, frameRate = 60, legacy = false };
            var properties = new[] { "m_LocalPosition.x", "m_LocalPosition.y", "m_LocalPosition.z", "m_LocalRotation.x", "m_LocalRotation.y", "m_LocalRotation.z", "m_LocalRotation.w", "m_LocalScale.x", "m_LocalScale.y", "m_LocalScale.z" };
            for (var node = 0; node < nodeCount; node++)
                for (var component = 0; component < 10; component++)
                {
                    var keys = new Keyframe[frameCount];
                    for (var frame = 0; frame < frameCount; frame++)
                    {
                        var v = values[(frame * nodeCount + node) * 10 + component];
                        // Reflection across Z: position.z and quaternion.x/y flip.
                        if (component == 2 || component == 3 || component == 4) v = -v;
                        keys[frame] = new Keyframe(times[frame], v);
                    }
                    // Lossless reduction of constant transform channels. Skeleton
                    // scale/offset curves otherwise repeat millions of identical
                    // keys and exhaust a mobile player's animation memory.
                    if (keys.All(key => key.value == keys[0].value))
                        keys = new[] { keys[0], keys[keys.Length - 1] };
                    var curve = new AnimationCurve(keys);
                    for (var frame = 0; frame < keys.Length; frame++)
                    {
                        AnimationUtility.SetKeyLeftTangentMode(curve, frame, AnimationUtility.TangentMode.Linear);
                        AnimationUtility.SetKeyRightTangentMode(curve, frame, AnimationUtility.TangentMode.Linear);
                    }
                    AnimationUtility.SetEditorCurve(clip, EditorCurveBinding.FloatCurve(paths[node], typeof(Transform), properties[component]), curve);
                }
            clip.EnsureQuaternionContinuity();
            return clip;
        }
    }
}
