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
uniform float circleSize;
uniform float elapsed;

vec3 getPosition(vec2 sPos, vec2 ePos, float cSize, float dur, float sTime, float e, float aHeight) {
  float adjustedDuration = distance(sPos, ePos) / cSize * dur;
  float endTime = sTime + adjustedDuration;
  float t = smoothstep(sTime, endTime, e);
  float z = aHeight * sin(3.1415 * t) * distance(sPos, ePos) / cSize * -1.0;
  vec2 newPosition = mix(sPos, ePos, t);
  return vec3(newPosition.xy, z);
}

void main() {
  fragColor = color;
  vec3 newPosition = getPosition(startPosition, endPosition, circleSize, duration, startTime, elapsed, arcHeight);
  gl_PointSize = pointSize;
  gl_Position = projection * view * vec4(newPosition, 1.0);
}
