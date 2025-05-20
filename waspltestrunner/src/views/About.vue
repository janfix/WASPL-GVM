<template>
  <Navbar/>
 <div class="aboutcontainer">
  <h1>Presentation of WASPL</h1>
<p>
  WASPL is an innovative and open-source platform dedicated to digital assessment, designed to meet the needs of teachers and trainers who want to create, manage, and deploy interactive online tests. The application is built on a modular architecture that enables the creation of various interactions (multiple choice, text gaps, ordering, matching, etc.) through an intuitive editor (WASPL-Editor) and the delivery of these tests to learners in a secure environment (WASPL-TestRunner).
</p>

<h2>Compatibility with Evaluation Standards (QTI 2.2, QTI 3, etc.)</h2>
<p>
  WASPL stands out for its compatibility with numerous evaluation standards, including <strong>QTI (Question and Test Interoperability) 2.2</strong> and <strong>QTI 3</strong>. These standards, widely used in education and digital testing, ensure interoperability between different platforms and tools.
</p>
<p>Thanks to this compatibility, WASPL enables:</p>
<ul>
  <li><strong>Importing QTI-compliant content:</strong> Teachers can import existing tests or items that adhere to QTI standards directly into WASPL for modification or deployment.</li>
  <li><strong>Exporting to standard formats:</strong> Tests created in WASPL can be exported in QTI formats to be used on other compatible platforms.</li>
  <li><strong>Seamless integration with LMS:</strong> WASPL facilitates the deployment of tests in environments such as Moodle, Canvas, or Blackboard thanks to these standard formats.</li>
</ul>

<h2>Integration with Artificial Intelligence</h2>
<p>
  WASPL connects to artificial intelligence tools to simplify and enrich the user experience. Among the AI-powered features:
</p>
<ul>
  <li><strong>Automatic generation of questions and interactions:</strong> Create interactive educational content from simple documents or instructions.</li>
  <li><strong>Smart and personalized feedback:</strong> Benefit from feedback tailored to learners' answers.</li>
  <li><strong>Predictive performance analysis:</strong> Identify learners' weaknesses and provide targeted recommendations.</li>
</ul>
<p>These tools not only save time but also offer a more engaging and effective learning experience.</p>

<h2>Functionality and Openness</h2>
<p>
  Built with modern technologies like <strong>Vue.js</strong>, <strong>Node.js</strong>, and <strong>MongoDB</strong>, WASPL offers an extensible and accessible solution. Its open-source model reflects its commitment to collaboration and shared innovation. Users can benefit from this free solution while actively contributing to its evolution by proposing ideas, reporting bugs, or developing new modules.
</p>

<h2>Call for Participation</h2>
<p>
  WASPL is a community project open to everyone. Whether you are a teacher, developer, expert in educational standards like QTI, or passionate about artificial intelligence and digital education, join us to enrich the platform. Whether by developing new features, improving compatibility tools, or sharing your feedback, every contribution—technical or pedagogical—is crucial to make WASPL an even more powerful and accessible tool.
</p>

<h2>About the Author</h2>
<p>
  WASPL is the result of the work of a passionate individual in pedagogy, digital technologies, and artificial intelligence, driven by the ambition to modernize evaluation tools. With solid experience in software development and educational project management, the author designed WASPL to meet the concrete needs of teachers while promoting a collaborative and open-source approach.
</p>

<p>
  <a href="#" class="cta">Discover WASPL and contribute today!</a>
</p>



 </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
</script>

<style scoped>
h1{color:orange;}
h2{color:cornflowerblue;}
.aboutcontainer{
  margin : 100px 400px 400px 400px;
}
</style>