# Chapter 05 — Linear Waveshaping
_Provenance: which textbook problem each generated item derives from._

## Conceptual questions
| id | source |
|---|--------|
| C01 | theory digest (ch05) |
| C02 | theory digest (ch05) |
| C03 | theory digest (ch05) |
| C04 | theory digest (ch05) |
| C05 | theory digest (ch05) |
| C06 | theory digest (ch05) |
| C07 | theory digest (ch05) |
| C08 | theory digest (ch05) |
| C09 | theory digest (ch05) |
| C10 | theory digest (ch05) |
| C11 | theory digest (ch05) |
| C12 | theory digest (ch05) |
| C13 | theory digest (ch05) |
| C14 | theory digest (ch05) |
| C15 | theory digest (ch05) |
| C16 | theory digest (ch05) |
| C17 | theory digest (ch05) |
| C18 | theory digest (ch05) |
| C19 | theory digest (ch05) |
| C20 | theory digest (ch05) |
| C21 | theory digest (ch05) |
| C22 | theory digest (ch05) |
| C23 | theory digest (ch05) |
| C24 | theory digest (ch05) |
| C25 | theory digest (ch05) |
| C26 | theory digest (ch05) |
| C27 | theory digest (ch05) |
| C28 | theory digest (ch05) |
| C29 | theory digest (ch05) |
| C30 | theory digest (ch05) |

## Circuit problems
| id | source base | textbook | base ref | generated question (truncated) |
|---|---|---|---|---|
| P01 | `N1` | Nils & Riedel 12e | NR Prob 7.90 (Sec 7.7) | An ideal inverting integrating amplifier has an input resistor of 20 kΩ and a feedback… |
| P02 | `N2` | Nils & Riedel 12e | NR Prob 7.91 (Sec 7.7) | Consider an ideal inverting integrating amplifier with an input resistance of 50 kΩ and a… |
| P03 | `N3` | Nils & Riedel 12e | NR Prob 7.92 (Sec 7.7) | Using the circuit from the previous problem (50 kΩ input resistor, 20 nF feedback… |
| P04 | `N4` | Nils & Riedel 12e | NR Prob 7.93 (Sec 7.7) | An ideal inverting integrating amplifier has an input resistor of 10 kΩ and a feedback… |
| P05 | `N5` | Nils & Riedel 12e | NR Prob 7.94 (Sec 7.7) | A voltage pulse of amplitude 10 V and width 1 ms is applied to an ideal inverting… |
| P06 | `N6` | Nils & Riedel 12e | NR Prob 7.95 (Sec 7.7) | Repeat the previous problem, but add a 1 MΩ resistor in parallel with the 50 nF feedback… |
| P07 | `N7` | Nils & Riedel 12e | NR Prob 7.96 (Sec 7.7) | A circuit consists of two cascaded ideal inverting integrating amplifiers. The first… |
| P08 | `N8` | Nils & Riedel 12e | NR Prob 7.97 (Sec 7.7) | An astable multivibrator circuit uses two transistors with collector resistors $R_C = 10$… |
| P09 | `N9` | Nils & Riedel 12e | NR Prob 7.98 (Sec 7.7) | Consider an astable multivibrator with $V_{CC} = 9$ V, $R_1 = R_2 = 18$ kΩ, and $C_1 =… |
| P10 | `N10` | Nils & Riedel 12e | NR Prob 7.99 (Sec 7.7) | Repeat the previous problem, but change the capacitor values to $C_1 = 3$ nF and $C_2 =… |
| P11 | `N11` | Nils & Riedel 12e | NR Prob 7.100 (Sec 7.7) | Design an astable multivibrator circuit using two NPN transistors with a supply voltage… |
| P12 | `N12` | Nils & Riedel 12e | NR Prob 7.104 (Practical Perspective: Artificial Pacemaker) | A cardiac pacemaker circuit uses a DC source $V_s = 9$ V, a resistor $R = 100$ kΩ, and a… |
| P13 | `N13` | Nils & Riedel 12e | NR Prob 7.105 (Practical Perspective) | Consider a pacemaker circuit with a supply voltage $V_s = 12$ V and a capacitor $C = 5$… |
| P14 | `N14` | Nils & Riedel 12e | NR Prob 7.106 (Practical Perspective) | Derive a general expression for the resistance $R$ in a pacemaker circuit in terms of the… |
| P15 | `N15` | Nils & Riedel 12e | NR Prob 7.107 (Practical Perspective) | Design a pacemaker circuit to operate at a heart rate of 72 beats per minute. The supply… |
| P16 | `H1` | Hayt 8e | H 8e Prob 7.5 #51 (Sec 7.5) | An op-amp circuit is configured as a differentiator by placing a capacitor $C = 0.1$ µF… |
| P17 | `H2` | Hayt 8e | H 8e Prob 7.5 #52 (Sec 7.5) | An integrating amplifier has an input resistor $R_1 = 50$ kΩ and a feedback capacitor… |
| P18 | `H3` | Hayt 8e | H 8e Prob 7.5 #53 (Sec 7.5) | An op-amp circuit uses an inductor $L_1 = 10$ mH in the input branch and a resistor $R_f… |
| P19 | `H4` | Hayt 8e | H 8e Prob 7.5 #54 (Sec 7.5) | A modified integrator circuit has an input resistor $R_1 = 10$ kΩ and a feedback branch… |
| P20 | `H5` | Hayt 8e | H 8e Prob 7.5 #55 (Sec 7.5) | A temperature sensor produces a voltage $v_s(t)$ proportional to temperature $T(t)$, with… |
| P21 | `H6` | Hayt 8e | H 8e Prob 7.5 #56 (Sec 7.5) | A confectionery bar production line uses a sensor that outputs a 200 mV peak-to-peak… |
| P22 | `H7` | Hayt 8e | H 8e Prob 7.5 #57 (Sec 7.5) | A satellite proton detector with an area of 1 cm² outputs a current equal to the number… |
| P23 | `H8` | Hayt 8e | H 8e Prob 7.5 #58 (Sec 7.5) | A velocity sensor outputs 10 mV for every 1 m/s of velocity. (a) Design an op-amp… |
| P24 | `H9` | Hayt 8e | H 8e Prob 7.5 #59 (Sec 7.5) | A fuel tank level is measured by a potentiometer where full tank corresponds to 1 Ω and… |
| P25 | `H10` | Hayt 8e | H 8e Prob 8.9 #65 (Sec 8.9) | Consider a circuit with an ideal op-amp configured as a non-inverting amplifier with a… |
| P26 | `H11` | Hayt 8e | H 8e Prob 8.8 #57 (Sec 8.8) | An RC step network consists of a voltage source $v_s(t)$, a resistor $R = 1$ kΩ, and a… |
| P27 | `H12` | Hayt 8e | H 8e Prob 8.9 #68 (Sec 8.9) | Consider a series RC circuit with $R = 1$ Ω and $C = 1$ F. The input voltage $v_s(t)$ is… |
| P28 | `H13` | Hayt 8e | H 8e Prob 8.9 #69 (Sec 8.9) | Consider the same series RC circuit with $R = 1$ Ω and $C = 1$ F. (a) Sketch the… |
| P29 | `H14` | Hayt 8e | H 8e Prob 8.9 #74 (Sec 8.9) | Consider an ideal op-amp circuit with an input resistor $R_1 = 1$ kΩ and a feedback… |
| P30 | `H15` | Hayt 8e | H 8e Prob 6.4 #17 (Sec 6.4) | An inverting op-amp differentiator circuit has an input capacitor $C = 10$ nF and a… |
