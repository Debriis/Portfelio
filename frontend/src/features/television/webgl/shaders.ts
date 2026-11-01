export const sceneVertex = `#version 300 es
in vec2 aPoint;
uniform vec4 uRect;
uniform vec2 uSize;
out vec2 vUv;
void main(){vUv=aPoint;vec2 p=uRect.xy+aPoint*uRect.zw;gl_Position=vec4(p.x/uSize.x*2.-1.,1.-p.y/uSize.y*2.,0.,1.);}`;
export const sceneFragment = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uImage;
uniform vec4 uCrop;
uniform vec2 uRectSize;
uniform float uRadius;
uniform float uFocus;
out vec4 color;
void main(){
 vec2 p=(vUv-.5)*uRectSize;
 vec2 q=abs(p)-(uRectSize*.5-vec2(uRadius));
 float d=length(max(q,0.))+min(max(q.x,q.y),0.)-uRadius;
 float edge=1.-smoothstep(-.8,.8,d);
 vec4 sampleColor=texture(uImage,uCrop.xy+vUv*uCrop.zw);
 if(uFocus>.5&&d>-2.5)sampleColor=vec4(1.,.95,0.,1.);
 color=vec4(sampleColor.rgb,sampleColor.a*edge);
}`;
export const glassVertex = `#version 300 es
in vec2 aPoint;
out vec2 vUv;
void main(){vUv=aPoint;gl_Position=vec4(aPoint.x*2.-1.,1.-aPoint.y*2.,0.,1.);}`;
export const glassFragment = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform vec2 uPull;
uniform float uTime;
uniform float uCurvature;
uniform float uChroma;
uniform float uScan;
uniform float uGrain;
out vec4 color;
float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 imageAt(vec2 p){return texture(uScene,vec2(p.x,1.-p.y)).rgb;}
void main(){
 vec2 p=vUv*2.-1.;
 vec2 warped=p*vec2(1.+uCurvature*p.y*p.y,1.+uCurvature*p.x*p.x);
 warped+=uPull*.009*(1.-p*p);
 vec2 uv=warped*.5+.5;
 vec2 safe=clamp(uv,vec2(0.),vec2(1.));
 float outside=max(max(-uv.x,uv.x-1.),max(-uv.y,uv.y-1.));
 float edge=1.-smoothstep(-.018,.002,outside);
 float radius=dot(p,p)*.5;
 float chroma=uChroma*(.14+3.2*radius*radius);
 vec2 split=normalize(p+vec2(.0001))*chroma;
 vec3 picture=vec3(imageAt(clamp(safe+split,0.,1.)).r,imageAt(safe).g,imageAt(clamp(safe-split,0.,1.)).b);
 // Phosphor spacing lives in the curved scene coordinates, not in a flat overlay.
 vec2 pixel=uv*uResolution;
 vec2 cells=mod(pixel,max(8.,uResolution.x/150.));
 float dots=(1.-smoothstep(.35,1.1,length(cells-vec2(1.))))*.065;
 picture+=dots*(1.-clamp(dot(picture,vec3(.2126,.7152,.0722)),0.,1.));
 float scan=1.-uScan*(.5+.5*sin(pixel.y*3.14159265));
 float noise=(random(floor(gl_FragCoord.xy)+floor(uTime*22.))-.5)*uGrain;
 float vignette=1.-smoothstep(.3,1.35,radius)*.45;
 vec2 border=abs(p);
 float rim=1.-smoothstep(.93,1.,max(border.x,border.y));
 picture=(picture*scan+noise)*vignette*mix(.68,1.,rim);
 color=vec4(max(picture,vec3(0.))*edge,1.);
}`;
