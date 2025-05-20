import { InteractionInterface } from './InteractionInterface';
import hotSpotRender from '../components/interactions/hotSpotRender.vue';

export class hotSpotInteraction extends InteractionInterface {
  constructor(question,testData) {
    super(question);
    this.testData = testData;
    this.userAnswer = '';
  }

   render() {
        return {
          component: hotSpotRender,
          props: {
            question: this.question,
            testData: this.testData, // Passe testData ici
          },
        };
      }
  

  restoreAnswer() {
    // Les messages n'ont pas de réponse à restaurer
  }

  calculateScore() {
    // Les messages ne contribuent pas au score
    return 0;
  }

  saveAnswer() {
    // Les messages n'ont pas de réponse à sauvegarder
    return null;
  }
}
