attribute vec2 startPosition;
attribute vec2 endPosition;
attribute vec4 color;
attribute float startTime;
attribute float duration;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform float pointSize;
uniform float arcHeight;
uniform float elapsed;
uniform float speed;

vec3 getPosition(vec2 sPos, vec2 ePos, float dur, float sTime, float e, float aHeight) {
  float adjustedStart = sTime / speed;
  float adjustedDuration = dur / speed;
  float endTime = adjustedStart + adjustedDuration;
  float t = smoothstep(adjustedStart, endTime, e);
  float z = aHeight * sin(3.1415 * t) * distance(sPos, ePos) * -0.1;
  vec2 newPosition = mix(sPos, ePos, t);
  return vec3(newPosition.xy, z);
}

void main() {
  fragColor = color;
  vec3 newPosition = getPosition(startPosition, endPosition, duration, startTime, elapsed, arcHeight);
  gl_PointSize = pointSize;
  gl_Position = projection * view * vec4(newPosition, 1.0);
}
