export type BackdropType = 'storefront' | 'aisle';

export interface CameraStep {
  step: number;
  instruction: string;
  subInstruction: string;
  backdrop: BackdropType;
}

export const TOTAL_CAMERA_STEPS = 2;

export const CAMERA_STEPS: CameraStep[] = [
  {
    step: 1,
    instruction: 'Capture Store Entrance',
    subInstruction: 'Stand facing the main entrance and capture the full storefront clearly',
    backdrop: 'storefront',
  },
  {
    step: 2,
    instruction: 'Capture Category Aisle',
    subInstruction: 'Walk to the product aisle and photograph the full aisle from end to end',
    backdrop: 'aisle',
  },
];
