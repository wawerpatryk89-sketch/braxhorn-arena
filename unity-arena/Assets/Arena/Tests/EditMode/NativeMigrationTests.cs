using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using Braxhorn.Arena.Editor;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Braxhorn.Arena.Tests
{
    public sealed class NativeMigrationTests
    {
        [Test]
        public void HandednessConversionReflectsTranslationAndRotation()
        {
            var source = Matrix4x4.TRS(new Vector3(2, 3, 4), Quaternion.Euler(0, 90, 0), Vector3.one);
            var json = new JArray();
            for (var column = 0; column < 4; column++)
                for (var row = 0; row < 4; row++) json.Add(source[row, column]);
            var converted = NativeFighterImporter.ConvertMatrix(json);
            Assert.That(Vector3.Distance(converted.GetColumn(3), new Vector3(2, 3, -4)), Is.LessThan(.0001));
            Assert.That(Vector3.Distance(converted.MultiplyVector(Vector3.forward), Vector3.left), Is.LessThan(.0001));
        }

        [Test]
        public void ImportedPosePreservesAllTransformChannelsAndReflectsZ()
        {
            var file = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".bytes");
            AnimationClip clip = null;
            try
            {
                using (var output = File.Create(file))
                using (var gzip = new GZipStream(output, CompressionMode.Compress))
                using (var writer = new BinaryWriter(gzip))
                {
                    writer.Write(Encoding.ASCII.GetBytes("BAP1")); writer.Write(1); writer.Write(3);
                    var path = Encoding.UTF8.GetBytes("Model/Hips"); writer.Write(path.Length); writer.Write(path);
                    writer.Write(0f); writer.Write(.5f); writer.Write(1f);
                    foreach (var x in new[] { 1f, 2f, 3f })
                        foreach (var value in new[] { x, 3f, 4f, 0f, 0f, 0f, 1f, 1f, 1f, 1f }) writer.Write(value);
                }
                clip = NativeFighterImporter.ImportAnimation(file, "fixture");
                var bindings = AnimationUtility.GetCurveBindings(clip);
                Assert.That(bindings.Length, Is.EqualTo(10));
                var curve = AnimationUtility.GetEditorCurve(clip, EditorCurveBinding.FloatCurve("Model/Hips", typeof(Transform), "m_LocalPosition.z"));
                Assert.That(curve.Evaluate(.5f), Is.EqualTo(-4).Within(.0001));
                Assert.That(curve.length, Is.EqualTo(2));
            }
            finally { if (clip) UnityEngine.Object.DestroyImmediate(clip); File.Delete(file); }
        }

        [Test]
        public void InvalidPoseIsRejectedBeforeCreatingAnAsset()
        {
            var file = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".bytes");
            try
            {
                using (var output = File.Create(file))
                using (var gzip = new GZipStream(output, CompressionMode.Compress))
                    gzip.Write(Encoding.ASCII.GetBytes("BAD!"), 0, 4);
                Assert.Throws<InvalidDataException>(() => NativeFighterImporter.ImportAnimation(file, "bad"));
            }
            finally { File.Delete(file); }
        }
    }
}
