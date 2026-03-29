<div style={styles.statusBar}>
  <div style={styles.statusInfo}>
    <span><strong>Stav:</strong> {status}</span>
    <span><strong>Nástroj:</strong> {tool}</span>
    <span>
      <strong>Souřadnice:</strong> X {mmToDisplay(pointer.x, units)} / Y{" "}
      {mmToDisplay(pointer.y, units)} {units}
    </span>
    {metricText ? <span><strong>{metricText}</strong></span> : null}
    {snapTarget ? (
      <span>
        <strong>Snap:</strong> {getSnapLabel(snapTarget.role)}
      </span>
    ) : null}
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {/* ☕ Buy me a coffee */}
    <a
      href="https://buymeacoffee.com/TVUJ_LINK"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: 12,
        opacity: 0.7,
        textDecoration: "none",
        color: "inherit",
        whiteSpace: "nowrap",
      }}
      title="Podpoř vývoj aplikace"
    >
      ☕ Buy me a coffee
    </a>

    {/* input */}
    <div style={styles.statusCommand}>
      <input
        ref={commandInputRef}
        type="number"
        step="0.001"
        value={commandValue}
        onChange={(e) => setCommandValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyCommandValue();
        }}
        placeholder={placeholder}
        style={{ ...styles.input, width: 140 }}
      />
      <button onClick={applyCommandValue} style={styles.primaryButton}>
        Použít
      </button>
    </div>
  </div>
</div>