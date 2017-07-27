precision mediump float;

uniform sampler2D curTripStateTexture;
uniform sampler2D prevTripStateTexture;
uniform sampler2D tripMetaDataTexture;
uniform float tick;
uniform float dampening;
uniform float stiffness;
uniform float maxArcHeight;
uniform float maxPointSize;
uniform bool showSubscriber;
uniform bool showNonSubscriber;
uniform bool curvedPaths;
uniform bool showPaths;
uniform bool showPoints;

varying vec2 tripStateIndex;

float getNextValue(float cur, float prev, float dest) {
  float velocity = cur - prev;
  float delta = dest - cur;
  float spring = delta * stiffness;
  float damper = velocity * -1.0 * dampening;
  return spring + damper + velocity + cur;
}

void main() {
  vec4 curState = texture2D(curTripStateTexture, tripStateIndex);
  vec4 prevState = texture2D(prevTripStateTexture, tripStateIndex);
  vec4 tripMetaData = texture2D(tripMetaDataTexture, tripStateIndex);

  bool isSubscriber = tripMetaData.x == 1.0;

  float destArcHeight = 0.0;
  float destPathAlpha = 0.0;
  float destPointSize = 0.0;

  if (isSubscriber) {
    if (showSubscriber && curvedPaths) destArcHeight = maxArcHeight;
    if (showSubscriber && showPaths) destPathAlpha = 1.0;
    if (showSubscriber && showPoints) destPointSize = maxPointSize;
  } else {
    if (showNonSubscriber && curvedPaths) destArcHeight = maxArcHeight;
    if (showNonSubscriber && showPaths) destPathAlpha = 1.0;
    if (showNonSubscriber && showPoints) destPointSize = maxPointSize;
  }

  float arcHeight = getNextValue(curState.x, prevState.x, destArcHeight);
  float pathAlpha = getNextValue(curState.y, prevState.y, destPathAlpha);
  float pointSize = getNextValue(curState.z, prevState.z, destPointSize);

  gl_FragColor = vec4(arcHeight, pathAlpha, pointSize, 0.0);
}
