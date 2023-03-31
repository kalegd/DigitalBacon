const Hands = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
};

Hands.otherHand = (hand) => {
    if(hand == Hands.LEFT) return Hands.RIGHT;
    if(hand == Hands.RIGHT) return Hands.LEFT;
    console.error('ERROR: Unexpected hand provided to Hands.otherHand');
}

export default Hands;
