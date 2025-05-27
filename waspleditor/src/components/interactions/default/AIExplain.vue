<template>
  <div class="accordion" id="AIcorrectionInfo">
    <div class="accordion-item">
      <h2 class="accordion-header" id="Introduction">
        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseIntro"
          aria-expanded="true" aria-controls="collapseIntro">
          <b>🔍 How AI Correction Works for Open-Ended Questions</b>
        </button>
      </h2>
      <div id="collapseIntro" class="accordion-collapse collapse" aria-labelledby="Introduction"
        data-bs-parent="#AIcorrectionInfo">
        <div class="accordion-body">
                   
          <p>AI-based correction relies on three key dimensions:</p>

          <b>1. Who are the students?</b>
          <p>Define their level, background, and learning context in the Test Parameters.</p>

          <b>2. What is the subject and assessment context?</b>
          <p>Provide the subject, domain, and optionally a domain-specific prompt.</p>

          <b>3. What correction model should be used?</b>
          <p>In the question editor, describe what a good answer looks like, define scoring criteria, and optional
          analytics (like profiles or scales).</p>

          <p>💡 Once all these are set, use the AI correction simulator in Preview. Type a sample student answer and click
          submit. <b>The AI will generate feedback based on a combined prompt with the defined score.</b></p>

          <p>Not satisfied with the results? Use the integrated AI chat to refine your correction prompt collaboratively.</p>
        
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {

}
</script>
<style></style>