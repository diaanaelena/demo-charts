export const createRhombusPath = (x, y, height, width) => {
    return `
        M ${x} ${y - height / 2}
        L ${x + width / 2} ${y}
        L ${x} ${y + height / 2}
        L ${x - width / 2} ${y}
        Z
    `;
  };

  export const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  export const width = 1000 - margin.left - margin.right;
  export const height = 400 - margin.top - margin.bottom;
