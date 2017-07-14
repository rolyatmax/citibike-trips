attribute vec2 position;
attribute vec4 color;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;

void main() {
  float d = distance(position, vec2(0.0, 0.0));
  fragColor = vec4(color.rgb, 1.0 - smoothstep(1.2, 1.8, d));
  gl_Position = projection * view * vec4(position, 0.0, 1.0);
}
