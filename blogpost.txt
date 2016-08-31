# Sub-bit information flows in Boolean circuits

Bits are a useful unit of information, but sometimes we run into a limitation, where information flows through a digital circuit that cannot be described using bits. For instance, as mentioned in [my previous draft text](https://github.com/michielbdejong/michielbdejong.com/blob/master/theo/n-to-n.md), `A XOR B` contains one full bit of information, but it's made up equally of information from input A and input B. Given A, b can be recovered entirely, and vice versa, so it's not clear at all how the two bits A and B are combined into one bit.

To investigate this, I generated an enumeration of minimal binary circuits that calculate a 3-to-1 bit function, using 2-to-1 bit logical gates. My first (rather naive) approach was first to list all functions that can be calculated without any gates at all. So that's A ('00001111'), B ('00110011'), C ('01010101'), and I also counted along the functions TRUE ('11111111') and FALSE ('00000000' here. Then I would repeatedly add one gate, looping over all possible gates ('0000' ... '1111') and over all possible left and right inputs, and see which extra functions can be additionally calculated with this one extra gate. I would repeat this until all function were covered.

It then occurred to me that this incremental method would never find circuits where the last output gate uses only internal wires as its input, for instance `(A XOR B) OR (A AND C)` could never be generated this way, neither by adding one gate to `(A XOR B)`, nor by adding one gate to `(A AND C)`. The circuit which calculates `(A XOR B)` and then discards this internal wire to put `(A AND C)` on the output wire is not optimal, so even though the 3-gate circuit might be optimal, it could never be found by incrementally adding gates one-by-one.

So my second approach was to first enumerate 2-gate circuits which are minimal for providing a given set of internal wires, and keeping these in the set as base-circuits even if they are not themselves optimal.

This led to so many 3-gate circuits that my script started running out of memory - especially when saving the data to a JSON file. I spent quite a bit of time optimizing the memory usage of the script and making it incremental so that it could take off where it left off after a crash.

After some analysis, I realized that a lot of circuits are essentially duplicates that do not need to be explored. First of all, each function and its complement can be calculated by almost the same circuit, differing only in the output sign of the last gate. For instance ((A XOR B) XOR C) and ((A XOR B) NXOR C) are very similar, and since each 2-to-1 logical gate has a complement, we can always have a minimal circuit for the second one if we found one for the first one.

Additionally, the sign of internal wires is irrelevant. The information conveyed by '01101111' is exactly the same information as that conveyed by '10010000', so if a first gate produces a signal whose signature does not start with a '0', I discard it.

And finally, some binary gates can never lead to an optimal circuit. A 2-to-1 binary gate can only be useful if it conveys information from both inputs in its output. So the gates '0000' and '1111', which ignore their inputs altogether, can be discarded, as well as '0011' (ignores right input) and '0101' (ignores left input), and their complements '1100' and '1010' (as noted above, we apply the sign at the output of the circuit, to keep the circuit simple and avoid duplicated).

That leaves us with '0001', '0010', '0100', '0110', '0111', '1000', '1001', '1011', '1101', and '1110', of which '1000', '1001', '1011', '1101', and '1110' can be discarded as duplicates of '0111', '0110', '0100', '0010', and '0001' respectively. Of each complement pair of gates, I only considered the one that outputs 0 if both inputs are 0. This means that a circuit's internal wires are always all 0 if all inputs are. Only the last gate can output 1 for all-zero inputs, so that functions like '11000000' can still be calculated (as a complement of '00111111').

I also improved the representation of the table of circuits in my script, and made it stream from input file to output file, so that after all these improvements, the script could run in under 10 seconds instead of taking several days. It still runs out of memory when you try to enumerate all minimal 4-to-1-bit functions, and the text file containing all optimal 4-gate base-circuits in 4 inputs (not necessarily minimally calculating a 4-to-1 function, but als all base-circuits that minimally provide a given set of internal wires, to base 5-gate circuits on), grows to several Gigabytes, so I concluded this information becomes too big to be useful - and anyhow, you have to stop somewhere. :)

Using the list of all minimal 3-to-1-bit circuits, I analyzed the information flow through them. I concluded that the information contained on each internal wire is best described as being different per input-valuation. Just saying that the wire conveys some Boolean function of the inputs doesn't help much to see which information follow which path through the circuit.

Given a certain input valuation, the information conveyed by each wire in the circuit can be described as the list of input valuations which the current value of that wire can rebuke. For instance, for input '010', the wire `(A AND B)` will have value 0, thus rebuking the input valuations for '110' and '111', for which it would be one. For input valuation '110' it rebukes input valuations '000', '001', '010', '011', '100', and '101'. So we could define that in the first case, this wire conveys 2 "subbits", and in the second case it conveys 6 "subbits".

Of course, the number of subbits for a wire, when counted this way, grows with the number of irrelevant additional inputs you add. The gate (A AND B) is itself oblivious of the input C, so if you consider it in isolation, it would be more appropriate to way its output conveys only 1 subbits instead of 2 when it outputs zero, and only 3 instead of 6 when it outputs one. By adding the number of subbits for all possible input valuations we would then get (3x1 + 1x3) instead of (6x2 + 2x6). If we were to consider the same gate in a 4-to-n-bit or 5-to-n-bit circuit, it would convey (12x4 + 12x4) subbits, (24x8 + 8x24) subbits, etcetera, multiplying the number of subbits by two for each irrelevant input added.

The maximum number of subbits that can theoretically be conveyed by one wire in a binary circuit is achieved when it carries a 1 for exactly have the input valuations; the number of valuations for n inputs is 2^n, and a wire can rebuke half of the other valuations no matter which input valuation your feed into the circuit, so the number of subbits carried by the wire would then be 2^n * 2^n/2 = 
2^(2n-1). So a wire in a circuit with three inputs can convey 2^(2*3-1) = 32 subbits.

When two wires meet each other at a digtal gate, the number of other input valuations they can rebuke together can add up if the other valuations rebuked by the left gate differ from the ones rebuked by the right one. This has to be analyzed for each actual input valuation separately. For instance, if you feed (A AND B) into a next binary gate as the left input, and (A OR B) as the right input, the subbits conveyed by (A AND B) don't add anything for input valuation '00'. You already know (A OR B) is false, so additionally knowing that (A AND B) is false does not add any information that could not already be deduced. The two inputs together provide the gate with basically a ternary variable; it will know when A and B are both 0, when A and B are both 1, and when exactly one of them is 1.

Splitting the input valuation space into three areas this way gives extra rebuking power:

A B (A AND B) (A OR B) Combined info (ternary variable)
0 0     0        0          0
0 1     0        1          1
1 0     0        1          1
1 1     1        1          2


The rebuking power of this ternary variable can be displayed as follows:

        rebukes:
A B var 00 01 10 11
0 0  0  *  Y  Y  Y
0 1  1  Y  *     Y 
1 0  1  Y     *  Y
1 1  2  Y  Y  Y  *

In this diagram '*' marks the current valuation, which is of course impossible to rebuke as this would lead to a contradiction.

Here is another example, where the two gate inputs lead to a quarternary variable in a 3-input circuit:

                     rebukes:
                     000 001 010 011 100 101 110 111
A B C left right var  0   1   2   3   0   1   2   3
0 0 0  0    0     0   *   Y   Y   Y       Y   Y   Y
0 0 1  0    1     1   Y   *   Y   Y   Y       Y   Y 
0 1 0  1    0     2   Y   Y   *   Y   Y   Y       Y
0 1 1  1    1     3   Y   Y   Y   *   Y   Y   Y    
1 0 0  0    0     0       Y   Y   Y   *   Y   Y   Y
1 0 1  0    1     1   Y       Y   Y   Y   *   Y   Y 
1 1 0  1    0     2   Y   Y       Y   Y   Y   *   Y
1 1 1  1    1     3   Y   Y   Y       Y   Y   Y   *

The trouble with choosing a digital gate to put into your circuit, once you chose its left and right inputs, is how to reduce a ternary or quarternary variable back to one binary gate output.

The quartenary variable in the last table carries 8*6=48 subbits ('Y' in the table), meaning we need to ditch at least 16 of its subbits in order to compress it to one bit (<=32 subbits) at the gate's output.

Put another way, the 4 groups defined by the quarternary variable need to be grouped into 2 groups. This can be done in the following ways:

0 1 2 3 #subbits lost
=======
0 0 0 1 6*4 = 24
0 0 1 0 6*4 = 24
0 1 0 0 6*4 = 24
1 0 0 0 6*4 = 24
0 1 1 0 8*2 = 16

You could also group quartenary value 3 together with value 2 or with value 1, but that would make the gate useless, as it would use info from only one of its inputs.

I don't yet know how to use this concept of 'subbits' to, for instance, predict bounds on how many gates will be necessary to calculate a given binary function, or to restrict the search space for minimal circuits in some other way.

I wanted to explore information at a scale smaller than one bit, as my previous draft post suggested this would be interesting. Maybe I'll leave this research direction for what it is for now, and try to get closer to the concept of entropy next.
