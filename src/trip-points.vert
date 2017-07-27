attribute vec2 startPosition;
attribute vec2 endPosition;
attribute vec4 color;
attribute float startTime;
attribute float duration;
attribute vec2 tripStateIndex;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform float elapsed;

uniform sampler2D tripStateTexture;

void main() {
  vec4 thisTripState = texture2D(tripStateTexture, tripStateIndex);
  float arcHeight = thisTripState.x;
  float pointSize = thisTripState.z;
  fragColor = color;
  float endTime = startTime + duration;
  float t = smoothstep(startTime, endTime, elapsed);
  float z = arcHeight * sin(3.1415 * t) * distance(startPosition, endPosition) * -0.1;
  vec3 newPosition = vec3(mix(startPosition, endPosition, t), z);
  float w = 1.0;
  if (t == 0.0 || t == 1.0) {
    w = 0.0;
  }
  gl_PointSize = pointSize;
  gl_Position = projection * view * vec4(newPosition, w);
}
