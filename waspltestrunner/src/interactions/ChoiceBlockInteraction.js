import { InteractionInterface } from './InteractionInterface';
import ChoiceBlockRender from '../components/interactions/ChoiceBlockRender.vue';

export class ChoiceBlockInteraction extends InteractionInterface {
 
  constructor(question,testData) {
    super(question);
    this.testData = testData;
    this.userAnswer = '';
  }

  render() {
      return {
        component: ChoiceBlockRender,
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
    const correctOption = this.question.options.find((opt) => opt.isCorrect);
    return correctOption && correctOption.id === userAnswer ? this.question.maxScore : 0;
  }

  saveAnswer() {
    return this.userAnswer;
  }
}
