attribute vec3 position;
attribute vec4 color;
attribute float startTime;
attribute float duration;
attribute vec2 tripStateIndex;

varying vec4 fragColor;
varying float discardMe;

uniform mat4 projection;
uniform mat4 view;
uniform float elapsed;
uniform sampler2D tripStateTexture;

void main() {
  vec4 thisTripState = texture2D(tripStateTexture, tripStateIndex);
  float arcHeight = thisTripState.x;
  float pathAlpha = thisTripState.y;
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
  float alpha = t / 1.3 * pathAlpha * 0.6;
  if (t == 0.0) {
    w = 0.0;
    discardMe = 1.0;
    alpha = 0.0;
  }
  float z = position.z * arcHeight;
  fragColor = vec4(color.rgb, color.a * alpha);
  gl_Position = projection * view * vec4(position.xy, z, w);
}
