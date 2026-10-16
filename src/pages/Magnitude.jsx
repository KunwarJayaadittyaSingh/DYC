import EventPage from '../Components/EventPage'
import Footer from './Footer'

const Magnitude = () => {
  return (
    <>
      <EventPage
        heading="Magnitude"
        category="LPU's Open Intra-University Cultural Fest"
        media="/images/MAGNITUDE.jpg"
        mediaType="image"
        description="Magnitude is DYC's flagship cultural fest — a full-scale celebration of music, dance, drama, and everything in between, open to every student across campus."
        galleryRows={[
          [
            '/images/MAGNITUDE.jpg',
            '/images/magnitude-2.jpg',
            '/images/magnitude-3.jpg',
            '/images/magnitude-4.jpg',
            '/images/magnitude-5.jpg',
          ],
          [
            '/images/magnitude-6.jpg',
            '/images/magnitude-8.jpg',
            '/images/magnitude-9.jpg',
            '/images/magnitude-10.jpg',
            '/images/magnitude-11.jpg'
          ],
          [
            '/images/magnitude-12.jpg',
            '/images/magnitude-13.jpg',
            '/images/magnitude-14.jpg',
            '/images/magnitude-15.jpg',
            '/images/magnitude-16.jpg',
          ],
        ]}
        registrationLink={null}
      />

      <Footer />
    </>
  )
}

export default Magnitude