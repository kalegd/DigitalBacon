//Max number of ids supported is 255 as these are stored in a single byte
const InternalMessageIds = {
    ASSET_ADDED_PART: 1,
    COMPONENT_ATTACHED: 2,
    COMPONENT_DETACHED: 3,
    ENTITY_ADDED: 4,
    ENTITY_ATTACHED: 5,
    ENTITY_POSITION: 6,
    ENTITY_ROTATION: 7,
    ENTITY_SCALE: 8,
    ENTITY_TRANSFORMATION: 9,
    PROJECT_PART: 10,
    USER_PERSPECTIVE: 11,
};

export default InternalMessageIds;
