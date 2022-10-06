uniform float uTime;
uniform float uProgress;
uniform float uSize;
varying vec2 vUv;
varying vec3 vPosition;
varying float vProgress;
varying float vDepth;
uniform sampler2D texture1;
attribute float aRotation;
attribute vec3 aDir;
attribute float aOffset;
attribute float aSpeed;
attribute float aRandom;
attribute vec3 aFinalPosition;
float PI = 3.141592653589793238;
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

void main() {
  vUv = uv;
  

  vec3 pos = position;
  // pos = mix(pos,vec3(0.),uProgress);

  // vec2 target = vec2(0.) + aDir.xy * 0.02 + vec2(0.0,-0.04);
  vec2 target = aFinalPosition.xy;
  vec2 start = vec2(pos.x,pos.y);
  vec2 control = vec2(pos.x/2.,0.) + aDir.xy*0.1*(1.-uProgress);
  // P = (1−t)2P1 + 2(1−t)tP2 + t2P3

  float koef = 0.7 + 0.1*aSpeed;
  float t = clamp((uProgress - (1.-koef)*aOffset)/koef ,0.,1.);

  t = t*(2.-t);
  vProgress = t;

  float bx = (1.-t)*(1.-t)*start.x + 2.*(1.-t)*t*control.x + t*t*target.x;
  float by = (1.-t)*(1.-t)*start.y + 2.*(1.-t)*t*control.y + t*t*target.y;
  float bz = t*aFinalPosition.z;

  pos.x = bx + + t*0.01*sin(uTime*0.05 + aRandom*7.);
  pos.y = by + t*0.01*cos(uTime*0.1 + aRandom*7.);
  pos.z = bz + t*0.01*sin(uTime*0.1 + aRandom*7.);



  pos = rotate(pos,vec3(0.,1.,0.),
  (1.-t)*aRotation*0.5 + (1.-t)*0.3 - 0.01*mod(uTime,300.)*(1.-t)
  );
  pos.x +=0.01;
  // pos += aDir;

  // pos = aFinalPosition;


  vec4 mvPosition = modelViewMatrix * vec4( pos, 1. );
  gl_PointSize = uSize*15.* (1. + aRandom)* ( 1. / - mvPosition.z );
  vDepth =  mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}