# Chapter 07 — Second-Order Circuits · Complete Response
_Provenance: which textbook problem each generated item derives from._

## Conceptual questions
| id | source |
|---|--------|
| C01 | theory digest (ch07) |
| C02 | theory digest (ch07) |
| C03 | theory digest (ch07) |
| C04 | theory digest (ch07) |
| C05 | theory digest (ch07) |
| C06 | theory digest (ch07) |
| C07 | theory digest (ch07) |
| C08 | theory digest (ch07) |
| C09 | theory digest (ch07) |
| C10 | theory digest (ch07) |
| C11 | theory digest (ch07) |
| C12 | theory digest (ch07) |
| C13 | theory digest (ch07) |
| C14 | theory digest (ch07) |
| C15 | theory digest (ch07) |
| C16 | theory digest (ch07) |
| C17 | theory digest (ch07) |
| C18 | theory digest (ch07) |
| C19 | theory digest (ch07) |
| C20 | theory digest (ch07) |
| C21 | theory digest (ch07) |
| C22 | theory digest (ch07) |
| C23 | theory digest (ch07) |
| C24 | theory digest (ch07) |
| C25 | theory digest (ch07) |
| C26 | theory digest (ch07) |
| C27 | theory digest (ch07) |
| C28 | theory digest (ch07) |
| C29 | theory digest (ch07) |
| C30 | theory digest (ch07) |

## Circuit problems
| id | source base | textbook | base ref | generated question (truncated) |
|---|---|---|---|---|
| P01 | `N23` | Nils & Riedel 12e | NR Sec 8.4 four-step method (original circuit) | At $t = 0$ a $12$ V dc source is switched in, in series with a $4$ $\Omega$ resistor… |
| P02 | `N18` | Nils & Riedel 12e | NR Prob 8.9 (Sec 8.1) | A source-free parallel RLC circuit has $L = 10$ mH, $C = 1$ $\mu$F, and a resistor $R$… |
| P03 | `N19` | Nils & Riedel 12e | NR Prob 8.10 (Sec 8.1) | A source-free parallel RLC circuit has $L = 0.4$ H and $C = 10$ $\mu$F, and its… |
| P04 | `N20` | Nils & Riedel 12e | NR Prob 8.5 (Sec 8.1) | A source-free parallel RLC circuit has $R = 2$ k$\Omega$, $L = 250$ mH, and $C = 10$ nF.… |
| P05 | `N24` | Nils & Riedel 12e | Sec 8.3 complete response, unbalanced bridge RLC (original circuit for practice) | At $t = 0$ the switch closes, connecting a $24$ V dc source to an unbalanced Wheatstone bridge… |
| P06 | `H15` | Hayt 8e | H 8e Examples 9.10-9.11 (Sec 9.6; topology reconstructed from the worked text) | In the two-loop RLC circuit shown, a current source $4u(t)$ A feeds node A and a $5$ A… |
| P07 | `H16` | Hayt 8e | H 8e Example 9.10 (Sec 9.6; same circuit as [H15]) | In the same two-source RLC circuit as the previous problem ($R = 30$ $\Omega$ between… |
| P08 | `N25` | Nils & Riedel 12e | Sec 8.3 complete response, two-stage L network (original circuit for practice) | At $t = 0$ the switch closes, connecting a $48$ V dc source through a series $6$ $\Omega$ resistor and $1$ H inductor to node B… |
| P09 | `N9` | Nils & Riedel 12e | NR Prob 8.49 (Sec 8.3) | The switch has been in position a for a long time, where a $100$ V source charged the $2$… |
| P10 | `N10` | Nils & Riedel 12e | NR Prob 8.52 (Sec 8.3) | The switch has been in position a for a long time, where a $28$ V source charged the $8$… |
| P11 | `N11` | Nils & Riedel 12e | NR Prob 8.53 (Sec 8.3) | A series RLC circuit consists of a DC voltage source, a resistor R = 100 Ω, an inductor L… |
| P12 | `N12` | Nils & Riedel 12e | NR Prob 8.17 (Sec 8.3) | Consider a series RLC circuit with a 100 V DC source, a resistor R = 2 kΩ, an inductor L… |
| P13 | `N13` | Nils & Riedel 12e | NR Prob 8.21 (Sec 8.3) | A circuit contains a 75 V DC source, a resistor R_1 = 6 kΩ, an inductor L = 12.5 H, and a… |
| P14 | `H17` | Hayt 8e | Sec 9.6 complete response, two-feed crossbar RLC (original circuit for practice) | At $t = 0$ the switch closes, connecting a $36$ V dc source to node P of the network shown… |
| P15 | `N15` | Nils & Riedel 12e | NR Prob 8.42 (Sec 8.4) | A source-free series RLC circuit has L = 250 mH and C = 160 nF. The resistance R is… |
| P16 | `N16` | Nils & Riedel 12e | NR Prob 8.38 (Sec 8.4) | A series RLC circuit consists of a 250 V DC source, a resistor R = 1 kΩ, an inductor L =… |
| P17 | `N17` | Nils & Riedel 12e | NR Prob 8.46 (Sec 8.4) | A circuit contains a 30 V DC source, a resistor R = 100 Ω, an inductor L = 2 H, and a… |
| P18 | `H1` | Hayt 8e | H 8e Prob 9.6 #52 (Sec 9.6) | A series RLC circuit is driven by a voltage source $v_s(t) = -8 + 2u(t)$ V. The circuit… |
| P19 | `H2` | Hayt 8e | H 8e Prob 9.6 #53 (Sec 9.6) | A series RLC circuit is driven by a voltage source $v_s(t) = 1 - 2u(t)$ V. The circuit… |
| P20 | `H3` | Hayt 8e | H 8e Prob 9.6 #54 (Sec 9.6) | An RLC network is driven by a current source $i_1(t) = 8 - 10u(t)$ mA. The network… |
| P21 | `H4` | Hayt 8e | H 8e Prob 9.6 #55 (Sec 9.6) | A series RLC circuit consists of a voltage source $v_s(t) = 12u(t)$ V, a $2$ k$\Omega$… |
| P22 | `H5` | Hayt 8e | H 8e Prob 9.6 #56 (Sec 9.6) | A series RLC circuit consists of a 12 V DC source, a $2$ $\Omega$ resistor, a $4$… |
| P23 | `H6` | Hayt 8e | H 8e Prob 9.6 #57 (Sec 9.6) | In the series RLC circuit from P22, the resistors are changed to $0.2$ $\Omega$ and $0.4$… |
| P24 | `H7` | Hayt 8e | H 8e Prob 9.6 #58 (Sec 9.6) | A parallel RLC circuit is driven by a current source $i_s(t) = 4u(-t) + 8u(t)$ mA. The… |
| P25 | `H8` | Hayt 8e | H 8e Prob 9.6 #59 (Sec 9.6) | Consider a parallel RLC circuit with $L = 4$ mH, $C = 2$ F, and a variable resistor $R$.… |
| P26 | `H9` | Hayt 8e | H 8e Prob 9.6 #51 (Sec 9.6) | A parallel RLC circuit has $L = 0.4$ H, $C = 10$ nF, and $R = 40$ k$\Omega$. It is driven… |
| P27 | `H10` | Hayt 8e | H 8e Prob 9.7 #66 (Sec 9.7) | A series RLC circuit contains a $20$ H inductor, a $10$ $\Omega$ resistor, and a… |
| P28 | `H11` | Hayt 8e | H 8e Prob 9.7 #65 (Sec 9.7) | A series RLC circuit has $L = 20$ H, $C = 2$ F, and two $2$ $\Omega$ resistors in series.… |
| P29 | `H12` | Hayt 8e | H 8e Prob 9.7 #67 (Sec 9.7) | In the circuit from P28, the current source is $10u(t)$ A. Obtain an expression for… |
| P30 | `H13` | Hayt 8e | H 8e Prob 9.6 #68 (Sec 9.6) | Design a parallel RLC circuit with $L = 1$ H and $C = 1$ F that produces an underdamped… |
