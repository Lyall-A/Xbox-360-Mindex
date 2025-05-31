# Reverse engineering of mindex for the Xbox 360 Music Player
Convert's songs to FMIM format and generates a mindex.xmi file

This is a weird format that I don't fully understand yet but it works

x360 Music Organizer achieves the same result but is closed-source and doesn't actually seem to implement the format very well

To run, have Node.js installed and run `node .` with all your songs in the `songs` directory, then place the mindex directory onto the root of your Xbox 360's HDD