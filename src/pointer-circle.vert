attribute float rads;

varying vec4 fragColor;

uniform vec3 center;
uniform float size;
uniform mat4 projection;
uniform mat4 view;
uniform vec3 color;

void main() {
  vec3 position = vec3(cos(rads), sin(rads), 0.0) * size + center;
  fragColor = vec4(color, 0.8);
  gl_Position = projection * view * vec4(position.xy, 0.001, 1.0);
}
