import { InteractionInterface } from './InteractionInterface';
import ChoiceRender from '../components/interactions/ChoiceRender.vue';

export class ChoiceInteraction extends InteractionInterface {
 
  constructor(question,testData) {
    super(question);
    this.testData = testData;
    this.userAnswer = '';
  }

  render() {
      return {
        component: ChoiceRender,
        props: {
          question: this.question,
          testData: this.testData,
          restoredAnswer: this.userAnswer, 
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
