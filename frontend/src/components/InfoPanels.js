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
            <div className="text-center">
              <h2 className="text-lg font-bold" style={{ color: "#fc961f" }}>
                General Information
              </h2>
              <p className="text-base mt-2" style={{ color: "#fc961f" }}>
                This component calculates the time until your next log slot based on preset completion rates.
              </p>
              <p className="text-base mt-2" style={{ color: "#fc961f" }}>
                Expand an activity by clicking it to view/adjust rates, add extra time (e.g. for the Inferno), and enable/disable activities.
              </p>
              <p className="text-base mt-2" style={{ color: "#fc961f" }}>
                Click the arrow button to toggle between completion rates for Main accounts or Iroman. Hover the completions/hr boxes to see the default values.
              </p>
              <h3 className="text-lg font-bold mt-3" style={{ color: "#fc961f" }}>
                Activity Rate Notes
              </h3>
              <p className="text-base mt-2" style={{ color: "#fc961f" }}>
                Some activities (e.g., Corporeal Beast, Last Man Standing) win fast because the sheet uses EHC rates—
                assuming methods like 2+6+6 boosting and filling games with alts. Adjust the rates in the "Completion Rates" tab if needed.
              </p>
              <h3 className="text-lg font-bold mt-3" style={{ color: "#fc961f" }}>
                Items without an Activity
              </h3>
              <ul className="text-base mt-2" style={{ color: "#fc961f", listStyle: "none", padding: 0 }}>
                <li>• Barronite mace (0 time reward for getting the 3 pieces)</li>
                <li>• Champion's cape (0 time reward for finishing the Champion&apos;s Challenge log)</li>
                <li>• Random event items (passive)</li>
                <li>• Imbued Heart, Eternal Gem, Brimstone key &amp; Larran&apos;s key uniques (Slayer meta-activities)</li>
                <li>• Obor&apos;s club, Bryophyta&apos;s essence, Dark claw, Skotos, Jar of Darkness, Dark Totem (Boss meta-activities)</li>
                <li>• Enhanced crystal key uniques (passive for irons, expensive for mains)</li>
              </ul>
            </div>
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
            <div className="text-center">
              <div className="flex items-center justify-center">
                <span className="text-base font-semibold" style={{ color: !isIron ? '#fc961f' : '#aaa' }}>
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
                <span className="text-base font-semibold" style={{ color: isIron ? '#fc961f' : '#aaa', marginLeft: '0.5rem' }}>
                  Ironman
                </span>
              </div>
              <p className="mt-2 text-base" style={{ color: "#fc961f" }}>
                Toggle between Normal and Ironman completion rates. Click an activity to compare the two sets of completions/hr. Hover the completions/hr boxes to see the default values
              </p>
            </div>
          </animated.div>
        ) : null
      )}
    </div>
  );
}

export default InfoPanels;
