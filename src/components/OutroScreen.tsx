import React from "react";
import { LottieButton } from "./LottieButton";
import { cn } from "../utils/cn";

interface OutroScreenProps {
  isVisible: boolean;
  onRestart: () => void;
}

export const OutroScreen = ({ isVisible, onRestart }: OutroScreenProps) => {
  return (
    <div className={cn("outro", isVisible && "is-visible")}>
      <p>
        Thank you for choosing Atmos for your trip, we hope to see you again
        very soon!
      </p>

      <div className="outro-cta">
        <LottieButton
          animationPath="/lottie/cta_end.json"
          onClick={onRestart}
          width={190}
        />
      </div>
    </div>
  );
};

export default OutroScreen;
