attribute vec2 position;

varying vec4 fragColor;

uniform mat4 projection;
uniform mat4 view;
uniform float elapsed;
uniform vec2 endPosition;
uniform float startTime;
uniform float duration;
uniform float arrivalAlpha;
uniform float radius;

void main() {
  vec4 color = vec4(0.7, 0.7, 1.0, 1.0);
  float start = startTime + duration;
  float circleDuration = 1000.0;

  float alpha = 0.0;
  float end = start + circleDuration;
  vec4 glPosition = vec4(0.0, 0.0, 0.0, 0.0);
  if (arrivalAlpha != 0.0 && elapsed >= start && elapsed <= end) {
    float midPoint = start + 100.0;
    if (elapsed < midPoint) {
      alpha = 1.0;
    } else {
      alpha = (1.0 - smoothstep(midPoint, end, elapsed));
    }
    float radiusMultiplier = smoothstep(start, end, elapsed) * 40.0;
    vec2 p = vec2(
      position.x * radius * radiusMultiplier + endPosition.x,
      position.y * radius * radiusMultiplier + endPosition.y
    );
    glPosition = projection * view * vec4(p, 0.0, 1.0);
    // float z = 1.0 - smoothstep(start, end, elapsed);
    // glPosition = vec4(glPosition.xy, -z, glPosition.w);
  }
  fragColor = vec4(color.rgb, alpha * arrivalAlpha);
  gl_Position = glPosition;
}
