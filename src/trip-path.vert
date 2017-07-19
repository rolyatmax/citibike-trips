attribute vec3 position;
attribute vec3 color;
attribute float startTime;
attribute float duration;

varying vec4 fragColor;
varying float discardMe;

uniform mat4 projection;
uniform mat4 view;
uniform float elapsed;
uniform float arcHeight;
uniform float pathAlpha;

void main() {
  float middle = startTime + duration / 2.0;
  float endTime = startTime + duration;
  float buf = 200.0;
  float t;
  if (elapsed < middle) {
    t = smoothstep(startTime - buf / 2.0, middle, elapsed);
  } else {
    t = 1.0 - smoothstep(middle, endTime + buf, elapsed);
  }
  float w = 1.0;
  discardMe = 0.0;
  float alpha = t / 1.3 * pathAlpha;
  if (t == 0.0) {
    w = 0.0;
    discardMe = 1.0;
    alpha = 0.0;
  }
  float z = position.z * arcHeight;
  fragColor = vec4(color.rgb, alpha);
  gl_Position = projection * view * vec4(position.xy, z, w);
}
