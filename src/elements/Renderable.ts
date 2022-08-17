export interface Renderable {
    /**
     * Returns a string that can be used as an HTML blob
     */
    render: () => string
}