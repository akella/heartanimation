uniform float time;
uniform float progress;
uniform vec3 uColor;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vProgress;
varying float vDepth;
float PI = 3.141592653589793238;

vec3 gammaCorrection (vec3 colour, float gamma) {
  return pow(colour, vec3(1. / gamma));
}
void main()	{
	vec3 initcolor = vec3(0.046, 0.888, 0.919);
	initcolor = uColor;
	vec3 bgColor = vec3(4.0/255.0, 10.0/255.0, 20.0/255.0);
	// vProgress
	float d = smoothstep(0.2,0.461,-vDepth);


	float particleIntencity = 40.3;
	vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
	vec4 color = vec4(initcolor,1.);
	vec2 cUv = uv * 2.0 - 1.0;

	color = vec4(0.08 / length(cUv.xy));
	color.rgb = min(vec3(10.), color.rgb);
	color.rgb *= bgColor * 120.0;


	//
	float blur = smoothstep(1., 0.5, length(cUv.xy));
	blur = pow(blur,0.5);
	// color.rgba *= 0.0;
	vec4 finalColor = vec4(0.);
	finalColor+=color*blur * (d);
	finalColor += vec4(blur*initcolor,0.2);

	

	float startOpacity = smoothstep(0.0, 0.03, vProgress);
	float endColor = smoothstep(0.96, 0.98, vProgress);
	float fadeOut = smoothstep(1., 0.99, vProgress);

	vec3 coloring = mix(vec3(1.),vec3(1.,0.,0.),endColor);
	finalColor.rgb *=coloring;

	gl_FragColor = finalColor*startOpacity;
	gl_FragColor.a *= max(0.5,fadeOut);
	// gl_FragColor = vec4(vec3(blur*initcolor*0.3),1.);
}