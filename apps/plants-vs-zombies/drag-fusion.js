(() => {
  let draggedPlantId = "";

  function fusionKey(a, b) {
    return [a, b].sort().join("+");
  }

  function fusionResult(baseType, addedType) {
    const rules = window.davidPvzFusions?.rules || [];
    const wanted = fusionKey(baseType, addedType);
    const match = rules.find(([key]) => key === wanted);
    return match ? match[1] : "";
  }

  function plantOnTile(row, col) {
    return state.plants.find((plant) => plant.row === row && plant.col === col);
  }

  function fuseAt(row, col, addedType) {
    if (!state.running || state.lost || state.won || state.deleteMode) return false;
    if (!state.equipped.includes(addedType)) return false;

    const base = plantOnTile(row, col);
    if (!base) return false;

    const result = fusionResult(base.type, addedType);
    if (!result || !plantStats[result]) {
      setMessage("No fusion", `${plantStats[base.type].name} does not fuse with ${plantStats[addedType]?.name || "that plant"}.`);
      return false;
    }

    const addedStats = plantStats[addedType];
    if (state.sun < addedStats.cost) {
      setMessage("Need more sun", `Fusing with ${addedStats.name} costs ${addedStats.cost} sun.`);
      return false;
    }

    const fusionStats = plantStats[result];
    state.sun -= addedStats.cost;
    Object.assign(base, {
      type: result,
      hp: fusionStats.hp,
      cooldown: fusionStats.sunRate || Math.min(fusionStats.fireRate || 900, 900),
      action: 900,
    });
    state.selected = addedType;
    setMessage(`${fusionStats.name} fused`, `${plantStats[base.type].name} was created by dragging ${addedStats.name} onto the plant.`);
    render();
    return true;
  }

  plantAt = function plantOnlyAt(row, col) {
    if (!state.running || state.lost || state.won) return;
    const existingIndex = state.plants.findIndex((plant) => plant.row === row && plant.col === col);
    if (state.deleteMode) {
      if (existingIndex === -1) return setMessage("No plant there", "Click a planted tile to remove that plant.");
      const [removed] = state.plants.splice(existingIndex, 1);
      setMessage("Plant removed", `${plantStats[removed.type].name} was deleted from the lawn.`);
      render();
      return;
    }
    if (existingIndex !== -1) {
      setMessage("Drag to fuse", "Drag a seed card onto this plant to fuse it. Clicking planted tiles no longer fuses.");
      return;
    }
    if (!state.equipped.includes(state.selected)) return;
    if (col > 5) return setMessage("Too far forward", "Plant closer to the house. Zombies enter from the right side.");
    const stats = plantStats[state.selected];
    if (state.sun < stats.cost) return setMessage("Need more sun", `${stats.name} costs ${stats.cost} sun.`);
    state.sun -= stats.cost;
    state.plants.push({ id: state.nextId += 1, type: state.selected, row, col, hp: stats.hp, cooldown: stats.sunRate || 420, action: 0 });
    setMessage(`${stats.name} planted`, stats.role);
    render();
  };

  const previousRenderSeedBank = renderSeedBank;
  renderSeedBank = function renderSeedBankWithDragFusion() {
    previousRenderSeedBank();
    els.seedBank.querySelectorAll(".fusion-hint").forEach((hint) => hint.remove());
    els.seedBank.querySelectorAll(".seed-card[data-plant]").forEach((card) => {
      card.draggable = true;
      card.setAttribute("aria-grabbed", "false");
      card.addEventListener("dragstart", (event) => {
        draggedPlantId = card.dataset.plant;
        card.classList.add("dragging");
        card.setAttribute("aria-grabbed", "true");
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", draggedPlantId);
        setMessage("Drag to fuse", `Drop ${plantStats[draggedPlantId].name} onto a planted tile to fuse.`);
      });
      card.addEventListener("dragend", () => {
        draggedPlantId = "";
        card.classList.remove("dragging");
        card.setAttribute("aria-grabbed", "false");
      });
    });
  };

  function lawnCellFromEvent(event) {
    const rect = els.lawn.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return {
      row: Math.max(0, Math.min(rows - 1, Math.floor(y * rows))),
      col: Math.max(0, Math.min(cols - 1, Math.floor(x * cols))),
    };
  }

  els.lawn.addEventListener("dragover", (event) => {
    if (!draggedPlantId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  els.lawn.addEventListener("drop", (event) => {
    const addedType = event.dataTransfer.getData("text/plain") || draggedPlantId;
    if (!addedType) return;
    event.preventDefault();
    const { row, col } = lawnCellFromEvent(event);
    fuseAt(row, col, addedType);
    draggedPlantId = "";
  });

  render();
})();
