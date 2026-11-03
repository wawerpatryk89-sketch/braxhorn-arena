using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

namespace Braxhorn.Arena
{
    // Track pointer ownership: releasing one finger must not release another.
    public sealed class TouchFightButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        readonly HashSet<int> pointers = new HashSet<int>();
        public Action Pressed;
        public Action Released;
        public bool Held => pointers.Count != 0;
        public void OnPointerDown(PointerEventData e) { if (pointers.Add(e.pointerId)) Pressed?.Invoke(); }
        void Remove(int id){if(pointers.Remove(id)&&pointers.Count==0)Released?.Invoke();}
        public void OnPointerUp(PointerEventData e) => Remove(e.pointerId);
        public void OnPointerExit(PointerEventData e) => Remove(e.pointerId);
        public void Release() => pointers.Clear();
        void OnDisable() => Release();
        void OnApplicationFocus(bool focus) { if (!focus) Release(); }
        void OnApplicationPause(bool paused) { if (paused) Release(); }
    }
}
