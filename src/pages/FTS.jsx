import EventPage from '../Components/EventPage'
import Footer from './Footer'

const FTS = () => {
  return (
    <>
      <EventPage
        heading="Freshmen Talent Search"
        category="Freshers Only"
        media="/images/FTS_Group_image.jpg"
        mediaType="image"
        description="FTS is where first-year students take the stage for the very first time — a competition built exclusively for freshers to showcase their talent and announce themselves to the campus."
        galleryRows={[
          [
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
          ],
          [
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
          ],
          [
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
            '/images/FTS_Group_image.jpg',
          ],
        ]}
        registrationLink={null}
      />
      <Footer />
    </>
  )
}

export default FTS