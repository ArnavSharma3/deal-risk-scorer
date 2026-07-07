"use client";

import { useCallback } from "react";
import { Joyride, STATUS, Step, EventData } from "react-joyride";

const steps: Step[] = [
  {
    target: ".deal-grid",
    title: "Your Pipeline at a Glance",
    content:
      "All open deals appear here as cards. Scan quickly to spot deals that need attention.",
    placement: "center",
    skipBeacon: true,
  },
  {
    target: ".deal-card",
    title: "Color-Coded Risk",
    content:
      "Cards are color-coded: green (low risk), yellow (medium risk), and red (high risk). Click any card to expand it and see AI-generated risk explanations, recommended next actions, and score history.",
    placement: "right",
  },
  {
    target: ".sort-controls",
    title: "Sort Your Pipeline",
    content:
      "Sort deals by risk score, deal value, or close date to match your priorities.",
    placement: "bottom",
  },
  {
    target: ".filters-panel",
    title: "Filter & Search",
    content:
      "Managers can filter by rep, risk level, deal value, and close date to focus coaching efforts.",
    placement: "bottom",
  },
];

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({ run, onComplete }: OnboardingTourProps) {
  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
        onComplete();
      }
    },
    [onComplete]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleEvent}
      options={{
        primaryColor: "#2563eb",
        showProgress: true,
        buttons: ["skip", "back", "primary"],
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Get Started",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
