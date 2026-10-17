/** The fallback is embedded, not a navigation to the hosted app. No account data crosses this bridge. */
export const nativeMapFallbackHtml = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css">
<style>html,body,#map{margin:0;width:100%;height:100%;background:#12151b} .maplibregl-ctrl-attrib{font:10px/18px sans-serif} .maplibregl-ctrl-top-left{top:auto;bottom:260px} .pin{box-sizing:border-box;border:3px solid white;border-radius:50%;width:32px;height:32px;background:#167655;color:white;text-align:center;line-height:26px;font: bold 18px/26px sans-serif} .driver{width:42px;height:42px;line-height:36px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
<script>
(function(){
  var map, state, camera, loaded=false, markers=[];
  function send(type){window.ReactNativeWebView.postMessage(JSON.stringify({type:type}));}
  function draw(){
    if(!loaded || !state)return;
    var route={type:'Feature',properties:{},geometry:{type:'LineString',coordinates:(state.route||[]).map(function(p){return [p.longitude,p.latitude];})}};
    if(route.geometry.coordinates.length<2)route.geometry.coordinates=[];
    if(!map.getSource('route')){
      map.addSource('route',{type:'geojson',data:route});
      map.addLayer({id:'route-edge',type:'line',source:'route',paint:{'line-color':'#fff','line-width':11},layout:{'line-cap':'round','line-join':'round'}});
      map.addLayer({id:'route-fill',type:'line',source:'route',paint:{'line-color':'#167655','line-width':7},layout:{'line-cap':'round','line-join':'round'}});
    }else map.getSource('route').setData(route);
    markers.forEach(function(m){m.remove();});markers=[];
    (state.pins||[]).forEach(function(p){
      var el=document.createElement('div');el.className='pin'+(p.driver?' driver':'');
      el.textContent=p.driver?'↑':(p.label||'');el.style.background=p.color||'#167655';
      el.setAttribute('aria-label',p.title||'Map marker');
      markers.push(new maplibregl.Marker({element:el,rotation:p.driver?p.heading||0:0,rotationAlignment:p.driver?'map':'viewport'}).setLngLat([p.longitude,p.latitude]).addTo(map));
    });
    document.querySelector('.maplibregl-ctrl-top-left').style.bottom=(state.attributionBottom||260)+'px';
  }
  function move(command){
    camera=command;if(!loaded)return;
    if(command.kind==='camera'){
      var c=command.value, current=map.getBearing(), target=c.heading||0;
      map.easeTo({center:[c.center.longitude,c.center.latitude],bearing:current+(((target-current+540)%360+360)%360)-180,pitch:c.pitch||0,zoom:c.zoom||16,duration:command.duration||0});
    }else if(command.kind==='region'){
      map.easeTo({center:[command.value.longitude,command.value.latitude],bearing:0,pitch:0,zoom:15,duration:command.duration||0});
    }else if(command.kind==='fit' && command.value.length){
      var bounds=new maplibregl.LngLatBounds();command.value.forEach(function(p){bounds.extend([p.longitude,p.latitude]);});
      var p=command.padding||{top:80,bottom:260,left:40,right:40};var factor=Math.min(1,Math.max(.2,(innerHeight-100)/(p.top+p.bottom)));
      map.fitBounds(bounds,{padding:{top:p.top*factor,bottom:p.bottom*factor,left:p.left,right:p.right},maxZoom:17,duration:450});
    }
  }
  window.cuboReceive=function(message){
    if(message.kind==='state'){
      var previousMode=state&&state.mode;state=message.value;
      if(!map){
        map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/'+(state.mode==='dark'?'dark':'liberty'),center:[state.center.longitude,state.center.latitude],zoom:15,attributionControl:false});
        map.addControl(new maplibregl.AttributionControl({compact:true}),'top-left');
        map.on('load',function(){loaded=true;draw();if(camera)move(camera);send('ready');});
        map.on('error',function(){send('error');});
        map.on('click',function(){send('press');});
        map.on('dragstart',function(){send('pan');});
        map.on('zoomstart',function(e){if(e.originalEvent)send('pan');});
        map.on('rotatestart',function(e){if(e.originalEvent)send('pan');});
      }else if(previousMode!==state.mode){
        loaded=false;map.setStyle('https://tiles.openfreemap.org/styles/'+(state.mode==='dark'?'dark':'liberty'));
        map.once('style.load',function(){loaded=true;draw();});
      }
      draw();
    }else move(message);
  };
  if(typeof maplibregl==='undefined')send('error');else send('bridge');
})();
</script></body></html>`;
