const { getSeconds } = require('./helpers')

module.exports = function createTimeline (el, trips) {
  const bucketGranularity = 60
  const maxBuckets = 60 * 60 * 24 / bucketGranularity
  const buckets = []
  for (let trip of trips) {
    // +1 to every bucket that this trip touches
    const startBucket = getSeconds(trip.start_ts) / bucketGranularity | 0
    const endBucket = Math.min(maxBuckets, Math.ceil(trip.duration / bucketGranularity) + startBucket)
    for (let i = startBucket; i <= endBucket; i++) {
      buckets[i] = buckets[i] || 0
      buckets[i] += 1
    }
  }

  console.log(buckets)

  return function renderTimeline (elapsed) {}
}
