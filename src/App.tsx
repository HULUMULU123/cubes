import { useEffect, useRef, useState } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import DiceBox from "@3d-dice/dice-box";

interface DicePreset {
  label: string;
  type: string;
  sides: number;
}

interface RollRecord {
  id: number;
  notation: string;
  results: number[];
  color: string;
}

const dicePresets: DicePreset[] = [
  { label: "d4", type: "d4", sides: 4 },
  { label: "d6", type: "d6", sides: 6 },
  { label: "d8", type: "d8", sides: 8 },
  { label: "d10", type: "d10", sides: 10 },
  { label: "d12", type: "d12", sides: 12 },
  { label: "d20", type: "d20", sides: 20 },
];

const DICE_CONTAINER_ID = "dice-box-container";

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Play', system-ui, -apple-system, sans-serif;
    background: #0f0e0d;
    color: #f5efe7;
    min-height: 100vh;
  }
`;

const woodTexture = `
  radial-gradient(ellipse at 10% 0%, rgba(255,255,255,0.08), transparent 45%),
  radial-gradient(ellipse at 90% 20%, rgba(255,255,255,0.04), transparent 40%),
  repeating-linear-gradient(90deg, rgba(61,35,19,0.5), rgba(61,35,19,0.5) 8px, rgba(75,46,26,0.75) 8px, rgba(75,46,26,0.75) 16px),
  linear-gradient(180deg, #4a2a16 0%, #3b2212 100%)
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  gap: 28px;
  padding: 32px clamp(16px, 5vw, 48px);
  position: relative;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    padding: 24px 16px 48px;
  }
`;

const Panel = styled.div`
  background: rgba(12, 9, 7, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
  padding: 20px;
  backdrop-filter: blur(12px);
`;

const Title = styled.h1`
  margin: 0 0 10px;
  font-size: 2rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Subtitle = styled.p`
  margin: 0 0 18px;
  color: rgba(245, 239, 231, 0.7);
  line-height: 1.6;
`;

const ControlGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px 18px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.95rem;
  color: rgba(245, 239, 231, 0.85);
`;

const Select = styled.select`
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: #f5efe7;
  font-size: 1rem;
`;

const NumberInput = styled.input`
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  color: #f5efe7;
  font-size: 1rem;
`;

const ColorInput = styled.input`
  height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1a120d;
  padding: 6px;
`;

const Slider = styled.input`
  appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 10px;
  background: linear-gradient(90deg, #c76b29, #f4c28b);
  outline: none;
  &::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fdf2d0;
    border: 2px solid #c76b29;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin: 12px 0 4px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  flex: 1;
  min-width: 180px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, #f3983f, #c45b1c);
  color: #1a0e08;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  }
  &:active {
    transform: translateY(0);
  }
`;

const ClearButton = styled(Button)`
  background: rgba(255, 255, 255, 0.05);
  color: #f5efe7;
`;

const Table = styled.div`
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: ${woodTexture};
  min-height: 520px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 25px 50px rgba(0, 0, 0, 0.65);
`;

const TableOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 50% 20%,
      rgba(0, 0, 0, 0.3),
      transparent 45%
    ),
    radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.18), transparent 48%);
  pointer-events: none;
`;

const DiceCanvas = styled.div`
  position: relative;
  height: 100%;
  min-height: 520px;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow: auto;
  margin-top: 12px;
`;

const ResultCard = styled.div<{ accent: string }>`
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 4px 0 0 ${(props) => props.accent};
`;

const ResultTitle = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
`;

const ResultValues = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: rgba(245, 239, 231, 0.86);
`;

const Glow = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 0.9; }
  100% { opacity: 0.3; }
`;

const LiveBadge = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(196, 91, 28, 0.95);
  color: #1a0e08;
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  &::before {
    content: "";
    width: 10px;
    height: 10px;
    background: #fdf2d0;
    border-radius: 50%;
    animation: ${Glow} 1.8s infinite ease-in-out;
  }
`;

const MobileDiagonal = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: none;

  @media (max-width: 720px) {
    display: block;
    &::after {
      content: "мобильная диагональ";
      position: absolute;
      top: -80px;
      right: -140px;
      transform: rotate(38deg);
      width: 360px;
      padding: 14px 0;
      text-align: center;
      background: linear-gradient(
        135deg,
        rgba(243, 152, 63, 0.95),
        rgba(196, 91, 28, 0.92)
      );
      color: #1a0e08;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
    }
  }
`;

const Hint = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: rgba(245, 239, 231, 0.8);
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ColorSwatch = styled.span<{ color: string }>`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: ${(props) => props.color};
  display: inline-block;
`;

const ErrorToast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(196, 91, 28, 0.92);
  color: #1a0e08;
  font-weight: 700;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
`;

function App() {
  const diceBoxRef = useRef<any | null>(null);
  const [selectedDice, setSelectedDice] = useState<DicePreset>(dicePresets[1]);
  const [quantity, setQuantity] = useState(3);
  const [size, setSize] = useState(10000000);
  const [color, setColor] = useState("#f3983f");
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initDice = async () => {
      try {
        console.log("[Dice] init start");

        const box = new DiceBox({
          assetPath: "/assets/dice-box/", // локальный путь (ammo + themes/default)
          container: `#${DICE_CONTAINER_ID}`,
          scale: 6,
          shadowQuality: 0.8,
          light: { intensity: 1.08, x: 0, y: 5, z: 2 },
          theme: "default", // используем стандартную тему
        });

        await box.init();
        console.log("[Dice] init done");

        if (!cancelled) {
          diceBoxRef.current = box;
          setLoading(false);
        }
      } catch (error) {
        console.error("[Dice] init error", error);
        if (!cancelled) {
          setInitError(
            "Не удалось загрузить кубики. Проверьте ассеты в /public/assets/dice-box."
          );
          setLoading(false);
        }
      }
    };

    initDice();

    return () => {
      cancelled = true;
      diceBoxRef.current?.clear();
      diceBoxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rollDice = async () => {
    if (!diceBoxRef.current) return;
    const notation = `${quantity}${selectedDice.type}`;

    const syntheticResult = Array.from(
      { length: quantity },
      () => Math.floor(Math.random() * selectedDice.sides) + 1
    );

    setHistory((prev) => [
      {
        id: Date.now(),
        notation,
        results: syntheticResult,
        color,
      },
      ...prev,
    ]);

    try {
      await diceBoxRef.current.roll(notation);
    } catch (error) {
      console.error("Roll failed", error);
      setInitError("Анимация броска недоступна, но результаты сохранены.");
    }
  };

  const clearHistory = () => setHistory([]);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Panel>
          <Title>Живой стол кубиков</Title>
          <Subtitle>
            Выбирайте типы, цвета и размер кубиков. Бросайте их на тёплый
            деревянный стол с объёмной анимацией — всё готово к быстрым
            партийным решениям.
          </Subtitle>

          <ControlGroup>
            <Label>
              Тип кубика
              <Select
                value={selectedDice.type}
                onChange={(event) =>
                  setSelectedDice(
                    dicePresets.find(
                      (preset) => preset.type === event.target.value
                    ) || dicePresets[0]
                  )
                }
              >
                {dicePresets.map((preset) => (
                  <option key={preset.type} value={preset.type}>
                    {preset.label}
                  </option>
                ))}
              </Select>
            </Label>

            <Label>
              Количество
              <NumberInput
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(10, Math.max(1, Number(event.target.value)))
                  )
                }
              />
            </Label>

            <Label>
              Цвет акцента
              <ColorInput
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </Label>

            <Label>
              Масштаб
              <Slider
                type="range"
                min={0.8}
                max={10000000000}
                step={0.05}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
            </Label>
          </ControlGroup>

          <ButtonRow>
            <Button onClick={rollDice} disabled={loading}>
              {loading
                ? "Загрузка стола..."
                : `Бросить ${quantity}${selectedDice.type}`}
            </Button>
            <ClearButton onClick={clearHistory}>Очистить историю</ClearButton>
          </ButtonRow>

          <Hint>
            <ColorSwatch color={color} />
            <span>
              Настройте оттенок, чтобы различать броски: яркий цвет подчеркнёт
              траекторию на столе, а размер поможет адаптировать мобильную
              диагональ.
            </span>
          </Hint>

          <ResultList>
            {history.map((record) => (
              <ResultCard key={record.id} accent={record.color}>
                <ResultTitle>{record.notation}</ResultTitle>
                <ResultValues>
                  {record.results.map((value, index) => (
                    <span key={index}>🎲 {value}</span>
                  ))}
                </ResultValues>
              </ResultCard>
            ))}
          </ResultList>
        </Panel>

        <Table>
          <LiveBadge>Live Roll</LiveBadge>
          <MobileDiagonal />
          <DiceCanvas id={DICE_CONTAINER_ID} />
          <TableOverlay />
        </Table>
      </Layout>
      {initError && <ErrorToast>{initError}</ErrorToast>}
    </>
  );
}

export default App;
