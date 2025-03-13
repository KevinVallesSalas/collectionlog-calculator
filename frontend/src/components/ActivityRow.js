import React, { useState, useEffect, useRef } from 'react';
import { animated, useTransition } from 'react-spring';
import ItemImage from './ItemImage';

function DebouncedInput({ type = "text", value, onDebouncedChange, delay = 500, ...props }) {
  const [internalValue, setInternalValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onDebouncedChange(newValue), delay);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDebouncedChange(internalValue);
  };

  return (
    <input
      type={type}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}

function ActivityRow({
  act,
  expandedActivity,
  toggleExpandedActivity,
  activeRowRef,
  itemsData,
  rate,
  isIron,
  handleRateChange,
  formatTimeInHMS,
  getTimeColor,
  disabled,
  handleDisableActivity
}) {
  const isActive = act.activity_name === expandedActivity;
  const detailTransition = useTransition(isActive, {
    from: { opacity: 0, maxHeight: 0 },
    enter: { opacity: 1, maxHeight: 500 },
    leave: { opacity: 0, maxHeight: 0 },
    config: { duration: 1000 }
  });

  const wikiUrl =
    itemsData &&
    itemsData[String(act.fastest_slot_id)] &&
    itemsData[String(act.fastest_slot_id)].wikiPageUrl
      ? itemsData[String(act.fastest_slot_id)].wikiPageUrl
      : `https://oldschool.runescape.wiki/w/${encodeURIComponent(act.fastest_slot_name)}`;

  return (
    <div
      className="snap-center rounded-lg shadow-lg mb-4 overflow-hidden border"
      style={{ borderColor: "#5c5647" }}
      ref={isActive ? activeRowRef : null}
    >
      {/* Summary row */}
      <div
        className="grid grid-cols-3 gap-x-4 py-2 items-center cursor-pointer px-4 transition-colors duration-500"
        style={{
          backgroundColor: isActive ? "#6f675e" : "#494034",
          borderBottom: "1px solid #5c5647"
        }}
        onClick={() => toggleExpandedActivity(act.activity_name)}
      >
        <div className="text-center">{act.activity_name}</div>
        <div
          className="text-center"
          style={{ color: disabled ? '#aaa' : getTimeColor(act.time_to_next_log_slot) }}
        >
          {disabled ? "Disabled" : formatTimeInHMS(act.time_to_next_log_slot)}
        </div>
        <div className="text-center">
          {act.fastest_slot_name === '-' ? (
            <span>-</span>
          ) : (
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center space-x-2 transition-transform duration-200 hover:scale-105 hover:underline"
            >
              {act.fastest_slot_id && (
                <ItemImage
                  itemId={act.fastest_slot_id}
                  fallbackName={act.fastest_slot_name}
                  className="w-8 h-8"
                  disableLink={true}
                />
              )}
              <span>{act.fastest_slot_name}</span>
            </a>
          )}
        </div>
      </div>
      {detailTransition((animatedStyle, item) =>
        item ? (
          <animated.div
            style={{
              ...animatedStyle,
              backgroundColor: "#6f675e",
              borderBottom: "1px solid #5c5647"
            }}
            className="detail-section px-4 rounded-b-lg overflow-hidden"
          >
            <div className="py-2">
              <div className="grid grid-cols-4 gap-4">
                <div
                  className="flex flex-col items-center gap-2 border rounded p-1"
                  style={{ borderColor: !isIron ? "#ffcc00" : "transparent" }}
                >
                  <label className="block text-sm font-semibold text-center" style={{ color: "#fc961f" }}>
                    Completions/hr (Main):
                  </label>
                  <DebouncedInput
                    type="number"
                    value={rate ? rate.user_completions_per_hour_main : ''}
                    onDebouncedChange={(newVal) =>
                      handleRateChange(act.activity_name, 'user_completions_per_hour_main', Number(newVal))
                    }
                    min="0"
                    className="border p-1 rounded text-center"
                    style={{ backgroundColor: "#28251e", color: "#fc961f", borderColor: "#5c5647" }}
                    title={rate ? `Default: ${rate.default_completions_per_hour_main}` : ''}
                  />
                </div>
                <div
                  className="flex flex-col items-center gap-2 border rounded p-1"
                  style={{ borderColor: isIron ? "#ffcc00" : "transparent" }}
                >
                  <label className="block text-sm font-semibold text-center" style={{ color: "#fc961f" }}>
                    Completions/hr (Iron):
                  </label>
                  <DebouncedInput
                    type="number"
                    value={rate ? rate.user_completions_per_hour_iron : ''}
                    onDebouncedChange={(newVal) =>
                      handleRateChange(act.activity_name, 'user_completions_per_hour_iron', Number(newVal))
                    }
                    min="0"
                    className="border p-1 rounded text-center"
                    style={{ backgroundColor: "#28251e", color: "#fc961f", borderColor: "#5c5647" }}
                    title={rate ? `Default: ${rate.default_completions_per_hour_iron}` : ''}
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <label className="block text-sm font-semibold text-center" style={{ color: "#fc961f" }}>
                    Extra Time (hrs):
                  </label>
                  <DebouncedInput
                    type="number"
                    value={rate ? rate.user_extra_time : ''}
                    onDebouncedChange={(newVal) =>
                      handleRateChange(act.activity_name, 'user_extra_time', Number(newVal))
                    }
                    min="0"
                    className="border p-1 rounded text-center"
                    style={{ backgroundColor: "#28251e", color: "#fc961f", borderColor: "#5c5647" }}
                    title={rate ? `Default: ${rate.default_extra_time} hours` : ''}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 border rounded p-1" style={{ borderColor: "#5c5647", backgroundColor: "#28251e" }}>
                  <span className="text-sm" style={{ color: disabled ? '#aaa' : '#fc961f' }}>Enable</span>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={disabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleDisableActivity(act.activity_name);
                      }}
                      className="peer sr-only"
                    />
                    <div
                      className="w-full h-full rounded-full transition-colors duration-500"
                      style={{
                        backgroundColor: disabled ? "#3e3529" : "#28251e",
                        border: "1px solid #5c5647"
                      }}
                    ></div>
                    <div
                      className="absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-500 transform peer-checked:translate-x-6"
                      style={{ backgroundColor: "#fc961f" }}
                    ></div>
                  </label>
                  <span className="text-sm" style={{ color: disabled ? '#fc961f' : '#aaa' }}>Disable</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-center" style={{ color: "#fc961f" }}>
                    Notes:
                  </label>
                  <div
                    className="border p-1 rounded text-center"
                    style={{ backgroundColor: "#28251e", color: "#fc961f", border: "1px solid #5c5647" }}
                  >
                    {rate ? rate.notes || '-' : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-center" style={{ color: "#fc961f" }}>
                    Verification Source:
                  </label>
                  <div
                    className="border p-1 rounded text-center"
                    style={{ backgroundColor: "#28251e", color: "#fc961f", borderColor: "#5c5647" }}
                  >
                    {rate ? rate.verification_source || '-' : '-'}
                  </div>
                </div>
              </div>
            </div>
          </animated.div>
        ) : null
      )}
    </div>
  );
}

export default ActivityRow;
