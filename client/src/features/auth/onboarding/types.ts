// Type for the object shape of our final data to patch.
export type OnboardingData = {
    displayName: string;
    program: string;
    year: number;
    bio: string;
    courseIds: number[];
    availability: { day: number; hour: number }[];
    studyStyle: string;
    groupSizeMin: number;
    groupSizeMax: number;
}

// Each step requires the current data, as well as a function to update it.
export type StepProps = {
    data: OnboardingData;
    update: (changes: Partial<OnboardingData>) => void;
}