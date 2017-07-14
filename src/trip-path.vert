attribute vec2 position;
attribute vec4 color;
attribute float startTime;
attribute float duration;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform float elapsed;
uniform float speed;

void main() {
  float adjustedStart = startTime / speed;
  float adjustedDuration = duration / speed;
  float middle = adjustedStart + adjustedDuration / 2.0;
  float endTime = adjustedStart + adjustedDuration;
  float buf = 2000.0;
  float t;
  if (elapsed < middle) {
    t = smoothstep(adjustedStart - buf / 2.0, middle, elapsed);
  } else {
    t = 1.0 - smoothstep(middle, endTime + buf, elapsed);
  }

  fragColor = vec4(color.rgb, t);
  gl_Position = projection * view * vec4(position, 0.0, 1.0);
}
