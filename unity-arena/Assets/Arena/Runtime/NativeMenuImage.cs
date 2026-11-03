using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.UI;

namespace Braxhorn.Arena
{
    // Each visible image owns its request/texture. Hidden pages release decoded
    // images; loading is independent from the match controller's coroutines.
    [RequireComponent(typeof(RawImage))]
    public sealed class NativeMenuImage : MonoBehaviour
    {
        RawImage graphic;
        Texture2D owned;
        UnityWebRequest request;
        string file;
        bool cover;
        int generation;
        Vector2 box;
        public void Show(string value,bool crop=false)
        {
            if(file==value&&cover==crop)return;
            Clear();file=value;cover=crop;
            if(isActiveAndEnabled&&!string.IsNullOrEmpty(file))StartCoroutine(Load());
        }
        void OnEnable(){if(!string.IsNullOrEmpty(file))StartCoroutine(Load());}
        void OnDisable(){Clear();}
        void OnDestroy(){Clear();}
        void Clear()
        {
            generation++;StopAllCoroutines();
            if(request!=null){request.Abort();request.Dispose();request=null;}
            if(!graphic)graphic=GetComponent<RawImage>();
            graphic.texture=null;graphic.enabled=false;
            if(owned)Destroy(owned);owned=null;
        }
        IEnumerator Load()
        {
            var token=++generation;
            if(!graphic)graphic=GetComponent<RawImage>();
            graphic.enabled=false;graphic.raycastTarget=false;
            request=UnityWebRequestTexture.GetTexture(ArenaMediaCatalog.Url(file),true);request.timeout=20;
            yield return request.SendWebRequest();
            if(token!=generation)yield break;
            if(request.result==UnityWebRequest.Result.Success)
            {
                owned=DownloadHandlerTexture.GetContent(request);graphic.texture=owned;
                Fit();graphic.enabled=true;
            }
            else Debug.LogWarning("Original menu image unavailable: "+file+" ("+request.result+")");
            request.Dispose();request=null;
        }
        void Fit()
        {
            var parent=(RectTransform)transform.parent;box=parent.rect.size;
            var rect=graphic.rectTransform;rect.anchorMin=rect.anchorMax=rect.pivot=new Vector2(.5f,.5f);rect.anchoredPosition=Vector2.zero;
            if(cover)
            {
                rect.sizeDelta=box;var target=box.x/Mathf.Max(1,box.y);var aspect=(float)owned.width/owned.height;
                var width=Mathf.Min(1,target/aspect);var height=Mathf.Min(1,aspect/target);
                graphic.uvRect=new Rect((1-width)/2,(1-height)/2,width,height);
            }
            else {var scale=Mathf.Min(box.x/owned.width,box.y/owned.height);rect.sizeDelta=new Vector2(owned.width,owned.height)*scale;graphic.uvRect=new Rect(0,0,1,1);}
        }
        void OnRectTransformDimensionsChange()
        {if(owned&&transform.parent is RectTransform p&&p.rect.size!=box)Fit();}
    }
}
