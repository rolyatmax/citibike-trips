attribute vec3 position;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform vec4 color;

void main() {
  fragColor = color;
  gl_Position = projection * view * vec4(position, 1.0);
}
