import { InteractionInterface } from './InteractionInterface';
import ShortAnswerRender from '../components/interactions/ShortAnswerRender.vue';

export class ShortAnswerInteraction extends InteractionInterface {
  constructor(question,testData) {
    super(question);
    this.testData = testData;
    this.userAnswer = '';
  }

  render() {
    return {
      component: ShortAnswerRender,
      props: {
        question: this.question,
        testData: this.testData, // Passe testData ici
      },
    };
  }

  restoreAnswer(savedAnswer) {
    this.userAnswer = savedAnswer;
  }

  calculateScore(userAnswer) {
    // Implémentez votre logique de score ici
    return 0; // Exemple : retourne 0 pour l'instant
  }

  saveAnswer() {
    return this.userAnswer;
  }
}
