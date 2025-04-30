export interface Config {
  settings: {
    questions: {
      min: number;
      max: number;
      default: number;
    };
    defaults: {
      difficulty: string;
    };
    difficulties: {
      id: string;
      label: string;
    }[];
  };
}
