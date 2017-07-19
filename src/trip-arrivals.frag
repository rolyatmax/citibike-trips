precision highp float;

varying vec4 fragColor;

void main() {
  if (fragColor[3] == 0.0) {
    discard;
  }
  gl_FragColor = fragColor;
}
