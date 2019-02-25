#extension GL_OES_standard_derivatives : enable
precision highp float;

varying vec4 fragColor;

void main() {
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  float r = dot(cxy, cxy);
  float delta = fwidth(r);
  float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
  if (r > 0.9) {
    discard;
  }
  gl_FragColor = fragColor * alpha;
}
