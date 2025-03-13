import React from 'react';
import { animated, useTransition } from 'react-spring';

function InfoPanels({
  isIron,
  setIsIron,
  setUserToggled,
  showGeneral,
  setShowGeneral,
  showAccount,
  setShowAccount
}) {

  // React Spring transitions for each panel
  const generalTransition = useTransition(showGeneral, {
    from: { opacity: 0, maxHeight: 0 },
    enter: { opacity: 1, maxHeight: 400 },
    leave: { opacity: 0, maxHeight: 0 },
    config: { duration: 500 }
  });

  const accountTransition = useTransition(showAccount, {
    from: { opacity: 0, maxHeight: 0 },
    enter: { opacity: 1, maxHeight: 250 },
    leave: { opacity: 0, maxHeight: 0 },
    config: { duration: 500 }
  });

  return (
    <div>
      {/* Animated General Info Panel */}
      {generalTransition((style, item) =>
        item ? (
          <animated.div
            style={{
              ...style,
              backgroundColor: "#6f675e",
              borderBottom: "1px solid #5c5647",
              overflow: "hidden"
            }}
            className="p-4 mb-2"
          >
            <p className="text-sm" style={{ color: "#fc961f" }}>
              This component calculates the time until your next log slot based on preset completion rates.
              Expand an activity by clicking it to view and adjust rates, add extra time (for example, increase the time to first completion for the Inferno if needed), and enable/disable activities.
            </p>
            <p className="mt-2 text-sm" style={{ color: "#fc961f" }}>
              For items without an activity, the Account Rates toggle below determines whether those items are included in the calculations.
            </p>
            <p className="mt-2 text-sm" style={{ color: "#fc961f" }}>
              <strong>Why are some activities like Corporeal Beast and Last Man Standing wins so fast?</strong>
              <br />
              The sheet uses EHC rates, assuming you'll be doing 2+6+6 boosting for Corporeal Beast and filling games with your alts for Last Man Standing.
              If you don’t plan on these methods, adjust the rates in the "Completion Rates" tab.
            </p>
            <p className="mt-2 text-sm" style={{ color: "#fc961f" }}>
              <strong>Items without an activity:</strong><br />
              • Barronite mace (0 time reward for getting the 3 pieces)<br />
              • Champion's cape (Basically 0 time reward for finishing the rest of the Champion's Challenge log)<br />
              • Random event items (passive)<br />
              • Imbued Heart, Eternal Gem, Brimstone key &amp; Larran's key uniques (Slayer meta-activities)<br />
              • Obor's club, Bryophyta's essence, Dark claw, Skotos, Jar of Darkness, Dark Totem (Boss meta-activities)<br />
              • Enhanced crystal key uniques (passive for irons, expensive for mains)
            </p>
          </animated.div>
        ) : null
      )}

      {/* Animated Account Rates Panel */}
      {accountTransition((style, item) =>
        item ? (
          <animated.div
            style={{
              ...style,
              backgroundColor: "#6f675e",
              borderBottom: "1px solid #5c5647",
              overflow: "hidden"
            }}
            className="p-4"
          >
            <div className="flex items-center">
              <span className="text-sm font-semibold" style={{ color: !isIron ? '#fc961f' : '#aaa' }}>
                Normal
              </span>
              <label className="relative inline-block w-16 h-6 mx-3">
                <input
                  type="checkbox"
                  checked={isIron}
                  onChange={() => {
                    setIsIron(prev => {
                      const newValue = !prev;
                      localStorage.setItem('isIron', JSON.stringify(newValue));
                      setUserToggled(true);
                      localStorage.setItem('userToggledMode', JSON.stringify(true));
                      return newValue;
                    });
                  }}
                  className="peer sr-only"
                />
                <div
                  className="w-full h-full rounded-full transition-colors duration-500"
                  style={{ backgroundColor: "#28251e", border: "1px solid #5c5647" }}
                ></div>
                <div
                  className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-500 transform peer-checked:translate-x-10"
                  style={{ backgroundColor: "#fc961f" }}
                ></div>
              </label>
              <span
                className="text-sm font-semibold"
                style={{ color: isIron ? '#fc961f' : '#aaa', marginLeft: '0.5rem' }}
              >
                Ironman
              </span>
            </div>
            <p className="mt-2 text-sm" style={{ color: "#fc961f" }}>
              Toggle between Normal and Ironman completion rates. To look at the differences in rates,
              click an activity and check the two boxes for completions/hr (one for a main, one for an ironman).
            </p>
          </animated.div>
        ) : null
      )}
    </div>
  );
}

export default InfoPanels;
