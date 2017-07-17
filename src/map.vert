attribute vec2 position;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform vec3 color;
uniform vec3 center;

void main() {
  float d = distance(position, center.xy);
  float alpha = (1.0 - smoothstep(0.1, 0.8, d)) / 1.5;
  fragColor = vec4(color, alpha);
  gl_Position = projection * view * vec4(position, 0.0, 1.0);
}
