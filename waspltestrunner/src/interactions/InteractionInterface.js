export class InteractionInterface {
    constructor(question, testData) {
     // console.log(question)
     // console.log(testData)
      if (new.target === InteractionInterface) {
        throw new Error('InteractionInterface is an abstract class and cannot be instantiated directly.');
      }
      this.question = question;
      this.testData = testData;
    }
  
    render() {
      throw new Error('render() must be implemented by the interaction plugin.');
    }
  
    restoreAnswer(savedAnswer) {
      throw new Error('restoreAnswer() must be implemented by the interaction plugin.');
    }
  
    calculateScore(userAnswer) {
      throw new Error('calculateScore() must be implemented by the interaction plugin.');
    }
  
    saveAnswer() {
      throw new Error('saveAnswer() must be implemented by the interaction plugin.');
    }
  }
  