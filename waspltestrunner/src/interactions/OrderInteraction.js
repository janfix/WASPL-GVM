import { InteractionInterface } from "./InteractionInterface";
import OrderRender from "../components/interactions/OrderRender.vue";

export class OrderInteraction extends InteractionInterface {
  constructor(question, testData) {
    super(question);
    this.testData = testData;
    this.userAnswer = [];
  }

  render() {
    return {
      component: OrderRender,
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

  calculateScore() {
    // Les messages ne contribuent pas au score
    return 0;
  }

  saveAnswer() {
    return this.userAnswer;
  }
}
