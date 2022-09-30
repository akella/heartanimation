uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
float PI = 3.141592653589793238;

vec3 gammaCorrection (vec3 colour, float gamma) {
//   return pow(colour, vec3(1. / gamma));
return colour
}
void main()	{
	// vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
	float uBias = 0.;
	float uScale = 1.;
	float uPower = 2.;
	vec3 V = normalize(vPosition.xyz - cameraPosition.xyz);    
    vec3 N = normalize(vNormal);
    
    float fresnel = uBias + uScale * pow(1.0 + dot(V, N), uPower);
	gl_FragColor = vec4(vNormal,1.);
	gl_FragColor = vec4(vNormal,1.);
	vec3 finalColor = mix(vec3(0.),vec3(1.)*0.3,fresnel);
	gl_FragColor = vec4(finalColor,1.);
}