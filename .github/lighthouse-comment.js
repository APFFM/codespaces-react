/**
 * Format lighthouse results as a markdown comment
 */
module.exports = function lighthouseCommentMaker(results) {
  if (!results || !results.length) {
    return '⚠️ No Lighthouse results found'
  }

  const detail = results[0]
  const { summary, performance, accessibility, bestPractices, seo, pwa } = detail

  const formatScore = (score) => {
    score = Math.round(score * 100)
    let color
    if (score >= 90) color = '🟢'
    else if (score >= 50) color = '🟠'
    else color = '🔴'
    return `${color} ${score}`
  }

  return `## ⚡ Lighthouse Performance Results

${detail.url}

| Category | Score |
| --- | --- |
| ${performance.title} | ${formatScore(performance.score)} |
| ${accessibility.title} | ${formatScore(accessibility.score)} |
| ${bestPractices.title} | ${formatScore(bestPractices.score)} |
| ${seo.title} | ${formatScore(seo.score)} |
| ${pwa.title} | ${formatScore(pwa.score)} |

*Lighthouse ran on [${new Date().toDateString()}](${detail.lhr.fetchTime})*

[📝 Full Report](${detail.links.html})
`
}
